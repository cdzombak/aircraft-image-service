'use strict';

const DAY_IN_SECONDS = 86400

const Promise = require('bluebird')
const rp = require('request-promise')
const CachemanRedis = require('cacheman-redis')

Promise.promisifyAll(CachemanRedis.prototype)

var redis_opts = {}
if (process.env.REDIS_PWD) redis_opts['password'] = process.env.REDIS_PWD
const cache = new CachemanRedis(redis_opts)

const app = require('express')()
app.set('port', (process.env.PORT || 5001))

function cacheKeyFromIcao(icao) {
  if (!icao) return null
  return "_acimage_ICAO:" + icao
}

app.get('/api/image', function(req, res) {
  const key = req.query['key']
  if (key !== process.env.CLIENT_KEY) {
    res.sendStatus(401)
    return
  }

  const icao = req.query['icao']
  const reg = req.query['reg']

  if (!icao) {
    res.sendStatus(400)
    return
  }

  const cacheKey = cacheKeyFromIcao(icao)

  cache.getAsync(cacheKey)
  .then(function(cachedResult) {
    if (cachedResult) {
      console.log('[acimages] Cache hit for', cacheKey)
      res.json(cachedResult)
      return
    }

    var url = "https://global.adsbexchange.com/VirtualRadar/AirportDataThumbnails.json?"
    if (icao) url += 'icao=' + icao + '&'
    if (reg) url += 'reg=' + reg + '&'
    url += 'numThumbs=1'

    const reqOptions = {
      url: url,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Accept-Charset': 'utf-8',
        'User-Agent': 'aircraft-image-service'
      },
      json: 'true'
    };

    console.log('[acimages] Image API request:', url)

    return rp(reqOptions).then(function(response) {
      console.log('[acimages] Image API response:', response)

      const data = response.data
      if (!data || !data.length) {
        return null
      }
      return data[0].image.replace('http://www.airport-data.com/', 'https://images.radarskill.cdzombak.net/apd-proxy/')
    })
    .then(function(thumbnailURL) {
      var result = {
        thumbnailURL: null,
        cached: null
      }

      if (thumbnailURL) {
        result['thumbnailURL'] = thumbnailURL
      }

      res.json(result)

      result['cached'] = new Date()
      return cache.setAsync(cacheKey, result, DAY_IN_SECONDS)
    })
  })
  .catch(function(err) {
    res.status(500).json(err)
    console.log('[acimages] Error processing "', cacheKey, '":', err)
  })
})

app.listen(app.get('port'), function(){
  console.log('[acimages] Listening on port', app.get('port'))
})
