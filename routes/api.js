/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
const mongoose = require('mongoose');
const Issue = require('../Issues.js');
const objectId = mongoose.Types.ObjectId;
const DB_URL = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

mongoose.connect(DB_URL, {useNewUrlParser: true})
  .then(() => console.log('Mongo DB Connected'))
  .catch(err => console.log('Error : ' + err));

function fillObjFromQuery(query, fields, obj={}) {
  fields.forEach(field => {
    if(query[field]) {
      obj[field] = query[field];
    }
  });
  return obj;
}

function validation(query, fields) {
  let err = [];
  
  fields.forEach(field => {
    console.log(query[field]);
    if(!query[field]) {
      err.push(field);
    }
  })
  if(err.length > 0) {
    return 'Missing fields : ' + err.join(', ');
  }
  else {
    return undefined;
  }
}

let fields = ['project','issue_title', 'issue_text', 'created_by', 'assigned_to', 'status_text', 'open', 'created_on', 'updated_on'];

module.exports = function (app) {

  app.route('/api/issues/:project')
  
    .get(function (req, res){
      var project = req.params.project;
      let query = fillObjFromQuery(req.query, fields);
      query.project = req.params.project;
      if(req.query._id) {
        query._id = objectId(req.query._id);
      }
    
      Issue.find(query, (err, issues) => {
        if(err) res.status(404).json(err);
        else res.json(issues);
      })
    })
    
    .post(function (req, res){
      req.body.project = req.params.project;
      let errors = validation(req.body, ['project','issue_title','issue_text','created_by']);
      console.log(errors);
      if(errors) {
        res.status(400).send(errors);
        return;
      }
    
      let issue = fillObjFromQuery(req.body, fields);
      issue.created_on = issue.updated_on = new Date().toISOString();
      let newIssue = new Issue(fillObjFromQuery(req.body, fields));
      newIssue.save((err, issue) => {
        if(err) res.status(400).send(err);
        else res.json(issue);
      })
    })
    
    .put(function (req, res){
      var project = req.params.project;
      let issueid = req.body._id;
      if(!issueid) {
        res.status(400).send('_id error');
      }
      issueid = objectId(issueid);
    
      let query = fillObjFromQuery(req.body, fields);
      if (!Object.keys(query).length) {
        return res.status(400).send('no updated field sent')
      }
    
      console.log(query);
    
      Issue.findByIdAndUpdate(issueid, query, {useFindAndModify: false})
        .then((issue) => {
            res.json(issue);
          })
        .catch(err => res.status(400).send("error in update"))
    })
    
    .delete(function (req, res){
      var project = req.params.project;
      let issueid = req.body._id;
      if(!issueid) {
        res.status(400).send('_id error');
        return;
      }
      issueid = objectId(issueid);
    
      Issue.findByIdAndDelete(issueid, (error, issue) => {
        if(error) {
          res.status(400).send("error in update");
        }
        else {
          res.send("deleted : " + issueid);
        }
      })
    });
    
};
