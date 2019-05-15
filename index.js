const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const _ = require('lodash');

require('dotenv').config();

const key = process.env.GOOGLE_MAPS_API_KEY;

async function fetchResult(url, parse) {
  const result = await fetch(url);
  const data = await result.json();

  return parse(data);
}

async function runScraper() {
  const mapsFile = fs.readFileSync(path.resolve(__dirname, 'test.txt'), 'utf8');

  const re1='(\\()';	// Any Single Character 1
  const re2='([+-]?\\d*\\.\\d+)(?![-+0-9\\.])';	// Float 1
  const re3='(.)';	// Any Single Character 2
  const re4='( )';	// Any Single Character 3
  const re5='([+-]?\\d*\\.\\d+)(?![-+0-9\\.])';	// Float 2
  const re6='(\\))';	// Any Single Character 4
  
  const regex = new RegExp(re1+re2+re3+re4+re5+re6,['g']);
  
  const records = mapsFile.match(regex);
  const results = [];
  const counter = records.length;

  console.log('Records: ', counter);

  try {
    for (let record of records) {
      console.log({record});

      const latlng = _.trimEnd(_.trimStart(record, '('), ')');

      console.log({latlng});

      const address = await fetchResult(
        `https://maps.googleapis.com/maps/api/geocode/json?key=${key}&latlng=${latlng}`,
        data => encodeURI(data.results[0].formatted_address),
      );

      console.log({address});

      const placeId = await fetchResult(
        `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?key=${key}&inputtype=textquery&input=${address}`,
        data => data.candidates.length && data.candidates[0].place_id,
      );

      console.log({placeId});

      if (placeId) {
        const result = await fetchResult(
          `https://maps.googleapis.com/maps/api/place/details/json?key=${key}&placeid=${placeId}`,
          data => data.result,
        );

        console.log(result.name);
  
        results.push(result); 
      }

      counter--;
      console.log(counter);
    }

    fs.writeFileSync('test.json', JSON.stringify({results})); 
  } catch (error) {
    console.log({error});
  }
}

runScraper();
