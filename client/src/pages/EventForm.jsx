import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';

// Convert an ISO timestamp to the value <input type="datetime-local"> expects.
function toDatetimeLocal(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

const emptyForm = { title: '', description: '', location: '', startsAt: '' };

export default function EventForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    api
      .getEvent(id)
      .then(({ event }) => {
        setForm({
          title: event.title,
          description: event.description || '',
          location: event.location || '',
          startsAt: toDatetimeLocal(event.starts_at),
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      title: form.title,
      description: form.description,
      location: form.location,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : '',
    };

    try {
      if (isEdit) {
        await api.updateEvent(id, payload);
      } else {
        await api.createEvent(payload);
      }
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Loading…</p>;

  return (
    <section className="form-page">
      <h1>{isEdit ? 'Edit event' : 'New event'}</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Title
          <input value={form.title} onChange={handleChange('title')} required />
        </label>
        <label>
          Starts at
          <input
            type="datetime-local"
            value={form.startsAt}
            onChange={handleChange('startsAt')}
            required
          />
        </label>
        <label>
          Location
          <input value={form.location} onChange={handleChange('location')} />
        </label>
        <label>
          Description
          <textarea value={form.description} onChange={handleChange('description')} rows={4} />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save'}
        </button>
      </form>
    </section>
  );
}
