# uriproj

Map projection functions from standard coordinate reference system (CRS) URIs.

This library makes it easy to retrieve map projection functions from CRS URIs.
It transparently fetches transformation data from https://epsg.io and uses [proj4js](http://proj4js.org/) to generate a projection out of that.
Once a projection has been generated, it is stored in a local cache for later use to avoid unnecessary network requests.

uriproj also supports manually adding a projection to the local cache together with its URI, either by supplying a PROJ.4 string or a `Projection` object with `forward()` and `inverse()` functions.

## Install

uriproj works on browsers and any tool following the CommonJS/node module conventions.

A minified browser version of this library is available in the [GitHub releases](https://github.com/Reading-eScience-Ccentre/uriproj/releases) as well as on [unpkg](https://unpkg.com/uriproj/). It can be included like that:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.3.14/proj4.js"></script>
<script src="https://unpkg.com/uriproj@0.2/uriproj.min.js"></script>
```

An ES6 import would look like that:
```js
import * as uriproj from 'uriproj'
```
## API documentation

<https://doc.esdoc.org/github.com/Reading-eScience-Centre/uriproj/>

## Usage

As an example, we load the British National Grid projection and convert geographic coordinates into projection coordinates and vice-versa.

```js
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

Currently, the following URIs are recognized by `load()` (in addition to those stored manually with `set()`):

- http://www.opengis.net/def/crs/OGC/1.3/CRS84
- http://www.opengis.net/def/crs/EPSG/0/ `<CODE>`

Any projection that has been previously `load()`'ed or stored with `set()` can be directly accessed via `get()`, avoiding the indirection of a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) as in `load()`:
```js
var proj = uriproj.get('http://www.opengis.net/def/crs/EPSG/0/27700')
var projected = proj.forward([longitude, latitude])
```

Manually storing projections using PROJ.4 strings or projection functions is possible with `set()`:

```js
var uri = 'http://www.opengis.net/def/crs/EPSG/0/27700'
var proj4 = '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 ' +
   '+ellps=airy +towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 +units=m +no_defs'
uriproj.set(uri, proj4)
```
