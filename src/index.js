import 'whatwg-fetch'
import proj4 from 'proj4'

const ROOT_PREFIX = 'http://www.opengis.net/def/crs/'
const OGC_PREFIX = ROOT_PREFIX + 'OGC/'
const EPSG_PREFIX = ROOT_PREFIX + 'EPSG/0/'

const LONLAT = proj4('+proj=longlat +datum=WGS84 +no_defs')

let projCache = {}

// CRSs that don't have an EPSG code
projCache[OGC_PREFIX + '1.3/CRS84'] = LONLAT

// CRSs that don't have proj4 strings in epsg.io
projCache[EPSG_PREFIX + 4979] = flipLatLon(LONLAT)

const needsLatLonReordering = {
  [EPSG_PREFIX + 4326]: true
}

/**
 * Turns projection with lon, lat axis order into one with lat, lon order.
 * Necessary since geographic projections in proj4 can only be defined with
 * lon,lat order, however some CRSs have lat,lon order (like EPSG4326).
 * Incorrectly, epsg.io returns a proj4 string (with lon,lat order) even if the CRS
 * has lat,lon order. This function manually flips the axis order of a given projections.
 * See also `needsLatLonReordering` above.
 */
function flipLatLon (proj) {
  return {
    forward: pos => proj.forward(pos).reverse(),
    inverse: pos => proj.inverse([pos[1], pos[0]])
  }
}

/**
 * @typedef {Object} Projection
 * @property {Function} forward [lon,lat] -> [x,y]
 * @property {Function} inverse [x,y] -> [lon,lat] 
 */

/**
 * 
 * @param {string} crsUri The CRS URI for which to return a projection.
 * @return {Promise<Projection>} A Promise object succeeding with a Projection object.
 */
export function load (crsUri) {
  if (crsUri in projCache) {
    return Promise.resolve(projCache[crsUri])
  }
  
  let epsg = crsUriToEPSG(crsUri)
  let url = `http://epsg.io/${epsg}.proj4`
  
  return fetch(url).then(response => {
    if (!response.ok) {
      throw new Error(`HTTP response code: ${response.status}`)
    }
    return response.text()
  }).then(proj4string => {
    let proj4obj = proj4(proj4string)
    if (!proj4obj) {
      throw new Error(`Unsupported proj4 string: ${proj4string}`)
    }
    if (crsUri in needsLatLonReordering) {
      proj4obj = flipLatLon(proj4obj)
    }
    projCache[crsUri] = proj4obj
    return get(crsUri)
  })
}

/**
 * 
 * @param {string} crsUri The CRS URI for which to return a projection.
 * @return {Projection} A Projection object, or undefined if not loaded previously by load(). 
 */
export function get (crsUri) {
  return projCache[crsUri]
}

/**
 * @param {string} crsUri The CRS URI for which to return the EPSG code.
 * @return {string} The EPSG code.
 */
function crsUriToEPSG (uri) {
  let epsg
  if (uri.indexOf(EPSG_PREFIX) === 0) {
    epsg = uri.substr(EPSG_PREFIX.length)
  } else {
    throw new Error(`Unsupported CRS URI: ${uri}`)
  }
  
  return epsg
}
