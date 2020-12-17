'use strict';

const express = require('express');
const app = express();
require('dotenv').config();
const pg = require('pg');
const superagent = require('superagent');


const client = new pg.Client({
  user: 'husam',
  password: '0000',
  database: 'covid19',
  port: 5432,
  host: 'localhost',
  ssl: true
});

/*const client = new pg.Client(process.env.DATABASE_URL);*/
const methodOverride = require('method-override');
const PORT = process.env.PORT;

app.use(express.static('./public'));
app.use(methodOverride('_method'));
app.use(express.urlencoded({extended: true}));
app.set('view engine', 'ejs');


app.get('/', homeHandler);
app.post('/getCountryResult', searchHandler);
app.get('/allCountries', allCountriesHandler);
app.get('/records', recordsHandler);
app.post('/addToRecords', addToRecordsHandler);
app.post('/records/viewRecord', getRecordHandler);
app.put('/records/updateRecord', updateRecordHandler);
app.delete('/records/deleteRecord', deleteRecordHandler);

app.get('*', notFound);
app.use(errorHandler);


function homeHandler(req, res) {
  let URL = `https://api.covid19api.com/world/total`;
  superagent(URL).then(results => {
    res.status(200).render('./index', {overallStats: results.body});
  }).catch((e) => {
    errorHandler(e, req, res);
  });
}


function searchHandler(req, res) {
  let {countryName, fromDate, toDate} = req.body;
  let URL = `https://api.covid19api.com/country/${countryName}/status/confirmed?from=${fromDate}&to=${toDate}`;
  superagent(URL).then(results => {
    res.render('./search/searchResults', {
      searchResults: results.body,
      countryName: countryName
    });
  }).catch((e) => {
    errorHandler(e, req, res);
  });
}


function allCountriesHandler(req, res){
  let URL = `https://api.covid19api.com/summary`;
  superagent(URL)
    .then(results =>{
      let countries = results.body.Countries.map( country =>{
        return new Country(country);
      });
      res.status(200).render('allCountries', {countries: countries});
    })
    .catch((e) => {
      errorHandler(e, req, res);
    });
}


function recordsHandler(req, res){
  let SQL = `SELECT * FROM records`;
  client.query(SQL)
    .then(results =>{
      res.render('records', {recs: results.rows});
    })
    .catch((e) => {
      errorHandler(e, req, res);
    });
}


function addToRecordsHandler(req, res){
  let {country, countryCode, confirmedCases, deathCases, recoveredCases, date} = req.body;
  let SQL = `INSERT INTO records(countryName, countryCode, confirmed, deaths, recovered, date) VALUES ($1, $2, $3, $4, $5, $6)`;
  let VALUES =  [country, countryCode, confirmedCases, deathCases, recoveredCases, date];

  client.query(SQL, VALUES)
    .then(()=>{
      res.redirect('/records');
    })
    .catch((e) => {
      errorHandler(e, req, res);
    });
}


function getRecordHandler(req, res){
  let SQL = `SELECT * FROM records WHERE id = $1`;
  client.query(SQL, [req.body.id])
    .then(result =>{
      res.render('./records/recordPage', {record: result.rows});
    })
    .catch((e) => {
      errorHandler(e, req, res);
    });
}


function deleteRecordHandler(req, res){
  let id = req.body.id;
  let SQL = `DELETE FROM records WHERE id = $1`;
  client.query(SQL, [id])
    .then(() =>{
      res.redirect('/records');
    })
    .catch((e) => {
      errorHandler(e, req, res);
    });
}


function updateRecordHandler(req, res){
  let {id, country, countryCode, confirmedCases, deathCases, recoveredCases, date} = req.body;
  let VALUES = [country, countryCode, confirmedCases, deathCases, recoveredCases, date, id];
  let SQL = `UPDATE records SET countryname= $1, countryCode = $2, confirmed=$3, deaths= $4, recovered = $5, date =$6 WHERE id = $7 RETURNING *`;
  client.query(SQL, VALUES)
    .then(result =>{
      res.render('./records/recordPage', {record: result.rows});
    })
    .catch((e) => {
      errorHandler(e, req, res);
    });
}


function notFound(req, res) {
  res.status(400).send('Not Found');
}


function errorHandler(err, req, res) {
  res.status(400).send('Something went wrong');
}


function Country(data) {
  this.name = data.Country;
  this.countryCode = data.CountryCode;
  this.confirmed = data.TotalConfirmed ;
  this.deaths = data.TotalDeaths ;
  this.recovered = data.TotalRecovered;
  this.date = data.Date;
}


client.connect().then(() => {
  app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });
});
