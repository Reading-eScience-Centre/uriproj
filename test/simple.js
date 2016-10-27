import assert from 'assert'
import {assertAlmostEqual} from './util.js'
import * as uriproj from '../src'
import proj4 from 'proj4'

const ROOT_PREFIX = 'http://www.opengis.net/def/crs/'
const OGC_PREFIX = ROOT_PREFIX + 'OGC/'
const EPSG_PREFIX = ROOT_PREFIX + 'EPSG/0/'

const CRS84 = OGC_PREFIX + '1.3/CRS84'
const EPSG4979 = EPSG_PREFIX + 4979

describe('special cases', () => {
  it('should handle CRS84', () => {
    let proj = uriproj.get(CRS84) // lon, lat
    let coords = [-71, 41] // [lon,lat]
    // identity projection, no changes in coordinates
    let projected = proj.forward(coords)
    assert.deepEqual(projected, coords)    
    let geo = proj.inverse(coords)
    assert.deepEqual(geo, coords)
  })
  it('should handle EPSG4979 in lat,lon order', () => {
    let proj = uriproj.get(EPSG4979) // lat,lon,height
    let coords = [-71, 41] // [lon,lat]
    let projected = proj.forward(coords)
    // the projected coords have to be in [lat,lon] order
    assert.deepEqual(projected, coords.slice().reverse())    
    let geo = proj.inverse([coords[1], coords[0]])
    assert.deepEqual(geo, coords)
  })
})

describe('#load', () => {
  it('should load data from epsg.io', () => {
    // British National Grid, [easting, northing]
    return uriproj.load(EPSG_PREFIX + 27700).then(proj => {
      let coords = [-1.54, 55.5] // [lon,lat]
      let projected = proj.forward(coords)
      // we're not checking for accuracy here
      assertAlmostEqual(projected[0], 429158, 6)
      assertAlmostEqual(projected[1], 623009, 6)
      let geo = proj.inverse(projected)
      assertAlmostEqual(geo[0], coords[0], 3)
      assertAlmostEqual(geo[1], coords[1], 3)
    })
  })
  it('should cache loaded projections', () => {
    let uri = EPSG_PREFIX + 27700
    return uriproj.load(uri).then(() => {
      let proj = uriproj.get(uri)
      assert(proj)
      let proj4Obj = proj4(uri)
      assert(proj4Obj)
    })
  })
})

describe('#set', () => {
  it('should store projection', () => {
    let uri = 'http://www.opengis.net/def/crs/EPSG/0/27700'
    let proj4 = '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 ' +
         '+ellps=airy +towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 +units=m +no_defs'
    uriproj.set(uri, proj4)
    assert(uriproj.get(uri))
  })
})
