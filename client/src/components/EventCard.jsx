import { Link } from 'react-router-dom';

function formatDate(isoString) {
  return new Date(isoString).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function EventCard({ event }) {
  return (
    <li className="event-card">
      <h3>
        <Link to={`/events/${event.id}`}>{event.title}</Link>
      </h3>
      <p className="event-meta">
        {formatDate(event.starts_at)}
        {event.location ? ` · ${event.location}` : ''}
      </p>
    </li>
  );
}
