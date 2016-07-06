# uriproj

Map projection functions from standard coordinate reference system URIs.

## Install

uriproj works on browsers and any tool following the CommonJS/node module conventions.

A minified browser version of this library is available in the [GitHub releases](https://github.com/reading-escience-centre/uriproj/releases) as well as on  [npmcdn](https://npmcdn.com/uriproj/). It can be included like that:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.3.14/proj4.js"></script>
<script src="https://npmcdn.com/uriproj@0.1/uriproj.min.js"></script>
```

An ES6 import would look like that:
```js
import * as uriproj from 'uriproj'
```

## Usage

```js
// British National Grid
uriproj.load('http://www.opengis.net/def/crs/EPSG/0/27700').then(proj => {
  // from WGS84 coordinates to projection coordinates
  var longitude = -1.54
  var latitude = 55.5  
  var projected = proj.forward([longitude, latitude])
  console.log('Easting: ', projected[0])
  console.log('Northing: ', projected[1])
  
  // back from projection coordinates to WGS84 geographic coordinates
  var geo = proj.inverse(projected)
  console.log('Longitude: ', geo[0])
  console.log('Latitude: ', geo[1])
})
```

Any projection that has been previously loaded can be directly accessed via `get()`:
```js
var proj = uriproj.get('http://www.opengis.net/def/crs/EPSG/0/27700')
var projected = proj.forward([longitude, latitude])
```

Currently, the following URIs are recognized:

- http://www.opengis.net/def/crs/OGC/1.3/CRS84
- http://www.opengis.net/def/crs/EPSG/0/ `<CODE>`

## How it works

This library relies on http://epsg.io for ad-hoc retrieval of [PROJ.4](https://github.com/OSGeo/proj.4) strings which are then fed into the [proj4js](http://proj4js.org/) library.

It also contains some work-arounds for cases like incorrect latitude/longitude axis ordering.
