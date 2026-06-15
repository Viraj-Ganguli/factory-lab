// HTTP layer for events: parse req, call service, shape res.
// Read endpoints are public; mutations require an admin session.
const express = require('express');
const eventsService = require('../services/events.service');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const events = await eventsService.listEvents();
    res.json({ events });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const event = await eventsService.getEvent(req.params.id);
    res.json({ event });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const event = await eventsService.createEvent(req.body || {}, req.session.userId);
    res.status(201).json({ event });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const event = await eventsService.updateEvent(req.params.id, req.body || {});
    res.json({ event });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    await eventsService.deleteEvent(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
