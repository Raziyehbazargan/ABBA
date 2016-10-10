'use strict';

// npm
const multer = require('multer');
const Router = require('express').Router;
const createError = require('http-errors');
const jsonParser = require('body-parser').json();
const debug = require('debug')('abba:profile-route');
const upload = multer({dest: `${__dirname}/../data`});

// app
const Profile = require('../model/profile.js');
const photoMiddleware = require('../lib/photo-aws-middleware.js');
const bearerAuth = require('../lib/bearer-auth-middleware.js');

// constants
const profileRouter = module.exports = Router();

profileRouter.post('/api/profile', jsonParser, bearerAuth,  function(req, res, next) {
  debug('POST /api/profile');

  req.body.userID = req.user._id;
  new Profile(req.body).save()
  .then( profile => res.json(profile))
  .catch(next);
});

profileRouter.post('/api/profile/:profID/photo', jsonParser, bearerAuth, upload.single('image'), photoMiddleware.photoUpload, function(req, res, next) {
  debug('POST /api/profile/:profID/photo');
  next();
});

profileRouter.delete('/api/profile/:profID/photo/:id', bearerAuth, photoMiddleware.photoDelete, function(req, res, next) {
  debug('DELETE /api/profile/:profID/photo/:id');
  next();
});

profileRouter.get('/api/profile/:id', bearerAuth, function(req, res, next) {
  debug('GET /api/profile/:id');

  Profile.findById(req.params.id)
  .then(profile => {
    if (profile.userID.toString() !== req.user._id.toString())
      return next(createError(401, 'invalid userid'));
    res.json(profile);
  })
  .catch(err => next(createError(404, err.message)));
});

profileRouter.delete('/api/profile/:id', bearerAuth, function(req, res, next){
  debug('DELETE /api/profile/:id');

  Profile.findById(req.params.id)
  .then( profile => {
    if(profile.userID.toString() !== req.user._id.toString())
      return next(createError(401, 'invalid userid'));
    return Profile.findByIdAndRemove(profile._id);
  })
  .then(next(res.status(204).send()))
  .catch(next(createError(404, 'invalid id')));
});
