// Business logic for events: validation + orchestration over the DAO.
// Admin-only access is enforced by route middleware (see middleware/auth.js);
// this layer focuses on data validation and shaping.
const eventsDao = require('../data-access/events.dao');
const { ValidationError, NotFoundError } = require('../errors');

function validateEventInput({ title, startsAt }, { partial = false } = {}) {
  if (!partial || title !== undefined) {
    if (!title || !String(title).trim()) {
      throw new ValidationError('title is required');
    }
  }

  if (!partial || startsAt !== undefined) {
    if (!startsAt || Number.isNaN(Date.parse(startsAt))) {
      throw new ValidationError('startsAt must be a valid date/time');
    }
  }
}

async function listEvents() {
  return eventsDao.findAll();
}

async function getEvent(id) {
  const event = await eventsDao.findById(id);
  if (!event) throw new NotFoundError('Event not found');
  return event;
}

async function createEvent(input, createdBy) {
  validateEventInput(input);
  return eventsDao.create({
    title: input.title.trim(),
    description: input.description ?? null,
    location: input.location ?? null,
    startsAt: input.startsAt,
    createdBy,
  });
}

async function updateEvent(id, input) {
  await getEvent(id); // throws NotFoundError if missing
  validateEventInput(input);

  return eventsDao.update(id, {
    title: input.title.trim(),
    description: input.description ?? null,
    location: input.location ?? null,
    startsAt: input.startsAt,
  });
}

async function deleteEvent(id) {
  const deleted = await eventsDao.remove(id);
  if (!deleted) throw new NotFoundError('Event not found');
}

module.exports = {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
};
