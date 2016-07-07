import 'whatwg-fetch'
import proj4 from 'proj4'

const ROOT_PREFIX = 'http://www.opengis.net/def/crs/'
const OGC_PREFIX = ROOT_PREFIX + 'OGC/'
const EPSG_PREFIX = ROOT_PREFIX + 'EPSG/0/'

/**
 * @typedef {Object} Projection
 * @property {function(lonlat: Array<number>): Array<number>} forward
 *   Transforms a geographic WGS84 [longitude, latitude] coordinate to an [x, y] projection coordinate.
 * @property {function(xy: Array<number>): Array<number>} inverse
 *   Transforms an [x, y] projection coordinate to a geographic WGS84 [longitude, latitude] coordinate.
 */

// a cache of URI string -> Projection object mappings
let projCache = {}

// work-arounds for incorrect epsg.io / proj4 behaviour
let needsAxesReordering = {
  [EPSG_PREFIX + 4326]: true // proj4 is [lon,lat], we need [lat,lon]
}

// store some built-in projections which are not available on epsg.io
let LONLAT = proj4('+proj=longlat +datum=WGS84 +no_defs')
set(OGC_PREFIX + '1.3/CRS84', LONLAT)
set(EPSG_PREFIX + 4979, reverseAxes(LONLAT))

/**
 * Returns a stored {@link Projection} for a given URI, or {@link undefined} if no {@link Projection} is stored for that URI.
 * 
 * @param {string} crsUri The CRS URI for which to return a {@link Projection}.
 * @return {Projection|undefined} A {@link Projection} object, or {@link undefined} if not stored by {@link load} or {@link set}.
 * 
 * @example
 * // has to be stored previously via load() or set()
 * var proj = uriproj.get('http://www.opengis.net/def/crs/EPSG/0/27700')
 * var [longitude, latitude] = [-1.54, 55.5]
 * var [easting,northing] = proj.forward([longitude, latitude])
 */
export function get (crsUri) {
  return projCache[crsUri]
}

/**
 * Returns a {@link Promise} that succeeds with an already stored {@link Projection} or, if not stored,
 * that remotely loads the {@link Projection} (currently using http://epsg.io), stores it, and then succeeds with it.
 * 
 * @param {string} crsUri The CRS URI for which to return a projection.
 * @return {Promise<Projection,Error>} A {@link Promise} object succeeding with a {@link Projection} object,
 *   and failing with an {@link Error} object in case of network or PROJ.4 parsing problems.
 * 
 * @example <caption>Loading a single projection</caption>
 * uriproj.load('http://www.opengis.net/def/crs/EPSG/0/27700').then(proj => {
 *   var [longitude, latitude] = [-1.54, 55.5]
 *   var [easting,northing] = proj.forward([longitude, latitude])
 * })
 * 
 * @example <caption>Loading multiple projections</caption>
 * var uris = [
 *   'http://www.opengis.net/def/crs/EPSG/0/27700',
 *   'http://www.opengis.net/def/crs/EPSG/0/7376',
 *   'http://www.opengis.net/def/crs/EPSG/0/7375']
 * Promise.all(uris.map(uriproj.load)).then(projs => {
 *   // all projections are loaded and stored now
 *   
 *   // get the first projection
 *   var proj1 = projs[0]
 *   // or:
 *   var proj1 = uriproj.get(uris[0])
 * })
 * 
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
  }).then(proj4string => set(crsUri, proj4string, {reverseAxes: crsUri in needsAxesReordering}))
}

/**
 * Stores a given projection for a given URI that can then be accessed via {@link get} and {@link load}.
 * 
 * @param {string} crsUri The CRS URI for which to store the projection.
 * @param {string|Projection} proj A proj4 string or a {@link Projection} object.
 * @param {Object} [options] Options object.
 * @param {boolean} [options.reverseAxes=false] If proj is a proj4 string, whether to reverse the projection axes.
 * @return {Projection} The newly stored projection.
 * @throws {Error} If crsUri or proj is missing, or if a PROJ.4 string cannot be parsed by proj4js. 
 * 
 * @example <caption>Storing a projection using a PROJ.4 string</caption>
 * var uri = 'http://www.opengis.net/def/crs/EPSG/0/27700'
 * var proj4 = '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 ' +
 *   '+ellps=airy +towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 +units=m +no_defs'
 * uriproj.set(uri, proj4)
 * 
 * @example <caption>Storing a projection using a Projection object</caption>
 * var uri = 'http://www.opengis.net/def/crs/EPSG/0/27700'
 * var proj = {
 *   forward: ([lon,lat]) => [..., ...],
 *   inverse: ([x,y]) => [..., ...]
 * }
 * uriproj.set(uri, proj)
 */
export function set (crsUri, proj, options={}) {
  if (!crsUri || !proj) {
    throw new Error('crsUri and proj cannot be empty')
  }
  if (typeof proj === 'string') {
    proj = proj4(proj4string)
    if (!proj4obj) {
      throw new Error(`Unsupported proj4 string: ${proj4string}`)
    }
    if (options.reverseAxes) {
      proj = reverseAxes(proj4obj)
    }
  }
  projCache[crsUri] = proj
  return proj
}

/**
 * Return the EPSG code of an OGC CRS URI of the form
 * http://www.opengis.net/def/crs/EPSG/0/1234 (would return 1234).
 * 
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

/**
 * Reverses projection axis order.
 * 
 * For example, a projection with lon, lat axis order is turned into one with lat, lon order.
 * This is necessary since geographic projections in proj4 can only be defined with
 * lon,lat order, however some CRSs have lat,lon order (like EPSG4326).
 * Incorrectly, epsg.io returns a proj4 string (with lon,lat order) even if the CRS
 * has lat,lon order. This function manually flips the axis order of a given projection.
 * See also `needsAxesReordering` above.
 * 
 * @param {Projection} proj The projection whose axis order to revert.
 * @return {Projection} The projection with reversed axis order.
 */
function reverseAxes (proj) {
  return {
    forward: pos => proj.forward(pos).reverse(),
    inverse: pos => proj.inverse([pos[1], pos[0]])
  }
}
