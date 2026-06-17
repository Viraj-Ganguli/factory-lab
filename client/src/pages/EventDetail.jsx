import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .getEvent(id)
      .then((data) => setEvent(data.event))
      .catch((err) => setError(err.message));
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this event?')) return;
    await api.deleteEvent(id);
    navigate('/');
  };

  if (error) return <p className="error">{error}</p>;
  if (!event) return <p>Loading…</p>;

  return (
    <article>
      <h1>{event.title}</h1>
      <p className="event-meta">
        {new Date(event.starts_at).toLocaleString(undefined, {
          dateStyle: 'full',
          timeStyle: 'short',
        })}
      </p>
      {event.location && <p className="event-meta">📍 {event.location}</p>}
      {event.description && <p>{event.description}</p>}

      {user?.isAdmin && (
        <div className="actions">
          <Link to={`/admin/events/${event.id}/edit`} className="button">
            Edit
          </Link>
          <button onClick={handleDelete} className="button-danger">
            Delete
          </button>
        </div>
      )}

      <p>
        <Link to="/">&larr; Back to events</Link>
      </p>
    </article>
  );
}
