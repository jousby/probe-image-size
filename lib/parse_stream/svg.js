'use strict'


var Transform = require('stream').Transform
var parseSvgHeader = require('../common/svg_header')

var STATE_IDENTIFY = 0 // look for '<'
var STATE_PARSE = 1 // extract width and height from svg tag
var STATE_IGNORE = 2 // we got all the data we want, skip the rest

// max size for pre-svg-tag comments plus svg tag itself
var MAX_DATA_LENGTH = 10240


function isWhiteSpace (chr) {
  return chr === 0x20 || chr === 0x09 || chr === 0x0D || chr === 0x0A
}


module.exports = function () {
  var state = STATE_IDENTIFY
  var data_len = 0
  var str = ''
  var buf = null // used to manage first chunk in IDENTIFY

  var parser = new Transform({
    readableObjectMode: true,
    transform: function transform (chunk, encoding, next) {
      switch (state) {
        // identify step is needed to fail fast if the file isn't SVG
        case STATE_IDENTIFY:
          if (buf) {
            // make sure that first chunk is at least 4 bytes (to do BOM skip later),
            // last chunk was small
            chunk = Buffer.concat([buf, chunk])
            buf = null
          }

          if (data_len === 0 && chunk.length < 4) {
            // make sure that first chunk is at least 4 bytes (to do BOM skip later),
            // current chunk is small
            buf = chunk
            break
          }

          var i = 0
          var max = chunk.length

          // byte order mark, https://github.com/nodeca/probe-image-size/issues/57
          if (data_len === 0 && chunk[0] === 0xEF && chunk[1] === 0xBB && chunk[2] === 0xBF) i = 3

          while (i < max && isWhiteSpace(chunk[i])) i++

          if (i >= max) {
            data_len += chunk.length

            if (data_len > MAX_DATA_LENGTH) {
              state = STATE_IGNORE
              parser.push(null)
            }
          } else if (chunk[i] === 0x3c /* < */) {
            state = STATE_PARSE
            return transform(chunk, encoding, next)
          } else {
            state = STATE_IGNORE
            parser.push(null)
          }

          break

        case STATE_PARSE:
          str += chunk.toString()

          // the header parser needs a closed tag to match anything, so there is
          // no point in rescanning all accumulated data until '>' arrives
          if (chunk.indexOf(0x3e /* > */) !== -1) {
            var result = parseSvgHeader(str)

            if (result) {
              state = STATE_IGNORE
              parser.push(result)
              parser.push(null)
              break
            }
          }

          data_len += chunk.length

          if (data_len > MAX_DATA_LENGTH) {
            state = STATE_IGNORE
            parser.push(null)
          }

          break
      }

      next()
    },

    flush: function () {
      state = STATE_IGNORE
      parser.push(null)
    }
  })

  return parser
}
