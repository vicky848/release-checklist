
import { useEffect, useState } from "react";
import "./App.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000/graphql";

const RELEASE_FIELDS = `
  id
  name
  releaseDate
  additionalInfo
  status
  steps {
    id
    title
    completed
  }
`;

async function graphqlRequest(query) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  const result = await response.json();

  if (result.errors) {
    throw new Error(result.errors[0].message);
  }

  return result.data;
}

function App() {
  const [releases, setReleases] = useState([]);
  const [name, setName] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [editingInfo, setEditingInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadReleases() {
    try {
      setError("");
      const data = await graphqlRequest(`
        query {
          releases {
            ${RELEASE_FIELDS}
          }
        }
      `);
      setReleases(data.releases);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReleases();
  }, []);

  async function createRelease(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const data = await graphqlRequest(`
        mutation {
          createRelease(
            name: ${JSON.stringify(name)}
            releaseDate: ${JSON.stringify(new Date(releaseDate).toISOString())}
            additionalInfo: ${JSON.stringify(additionalInfo)}
          ) {
            ${RELEASE_FIELDS}
          }
        }
      `);

      setReleases((current) => [...current, data.createRelease]);
      setName("");
      setReleaseDate("");
      setAdditionalInfo("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleStep(release, step) {
    try {
      setError("");

      const data = await graphqlRequest(`
        mutation {
          updateStep(
            releaseId: ${JSON.stringify(release.id)}
            stepId: ${JSON.stringify(step.id)}
            completed: ${!step.completed}
          ) {
            ${RELEASE_FIELDS}
          }
        }
      `);

      setReleases((current) =>
        current.map((item) =>
          item.id === release.id ? data.updateStep : item
        )
      );
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveInfo(release) {
    try {
      setError("");

      const info = editingInfo[release.id] ?? release.additionalInfo;

      const data = await graphqlRequest(`
        mutation {
          updateAdditionalInfo(
            releaseId: ${JSON.stringify(release.id)}
            additionalInfo: ${JSON.stringify(info)}
          ) {
            ${RELEASE_FIELDS}
          }
        }
      `);

      setReleases((current) =>
        current.map((item) =>
          item.id === release.id ? data.updateAdditionalInfo : item
        )
      );

      setEditingInfo((current) => {
        const next = { ...current };
        delete next[release.id];
        return next;
      });
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteRelease(id) {
    if (!window.confirm("Are you sure you want to delete this release?")) {
      return;
    }

    try {
      setError("");

      await graphqlRequest(`
        mutation {
          deleteRelease(id: ${JSON.stringify(id)})
        }
      `);

      setReleases((current) =>
        current.filter((release) => release.id !== id)
      );
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#">
          <span className="brand-icon">R</span>
          ReleaseBoard
        </a>
        <span className="api-status">
          <span className="status-dot" />
          Release workspace
        </span>
      </header>

      <section className="page-heading">
        <p className="eyebrow">RELEASE MANAGEMENT</p>
        <h1>Release checklist</h1>
        <p className="subtitle">
          Plan releases, track every step, and ship with confidence.
        </p>
      </section>

      {error && (
        <div className="error-message" role="alert">
          {error}
          <button onClick={() => setError("")} aria-label="Dismiss error">
            ×
          </button>
        </div>
      )}

      <section className="create-panel">
        <h2>Create a release</h2>
        <form className="release-form" onSubmit={createRelease}>
          <label>
            Release name *
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Version 2.0"
              maxLength={200}
              required
            />
          </label>

          <label>
            Release date and time *
            <input
              type="datetime-local"
              value={releaseDate}
              onChange={(event) => setReleaseDate(event.target.value)}
              required
            />
          </label>

          <label className="full-width">
            Additional information
            <textarea
              value={additionalInfo}
              onChange={(event) => setAdditionalInfo(event.target.value)}
              placeholder="Optional notes for this release..."
              rows={2}
            />
          </label>

          <button className="primary-button" disabled={saving}>
            {saving ? "Creating..." : "+ Create release"}
          </button>
        </form>
      </section>

      <section className="release-section">
        <div className="section-heading">
          <div>
            <h2>Your releases</h2>
            <p>Track progress across your planned releases.</p>
          </div>
          <span className="count-badge">{releases.length} releases</span>
        </div>

        {loading ? (
          <p className="empty-state">Loading releases...</p>
        ) : releases.length === 0 ? (
          <div className="empty-state">
            <h3>No releases yet</h3>
            <p>Create your first release using the form above.</p>
          </div>
        ) : (
          <div className="release-list">
            {releases.map((release) => {
              const completedCount = release.steps.filter(
                (step) => step.completed
              ).length;

              const progress = Math.round(
                (completedCount / release.steps.length) * 100
              );

              return (
                <article className="release-card" key={release.id}>
                  <div className="release-card-header">
                    <div>
                      <p className="release-date">
                        {new Date(release.releaseDate).toLocaleString()}
                      </p>
                      <h3>{release.name}</h3>
                    </div>

                    <span className={`status-badge ${release.status}`}>
                      {release.status}
                    </span>
                  </div>

                  <div className="progress-heading">
                    <span>Checklist progress</span>
                    <strong>
                      {completedCount}/{release.steps.length}
                    </strong>
                  </div>

                  <div
                    className="progress-track"
                    role="progressbar"
                    aria-valuenow={completedCount}
                    aria-valuemin={0}
                    aria-valuemax={release.steps.length}
                    aria-label="Checklist progress"
                  >
                    <div
                      className="progress-fill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="checklist">
                    {release.steps.map((step) => (
                      <label
                        className={`checklist-item ${
                          step.completed ? "completed" : ""
                        }`}
                        key={step.id}
                      >
                        <input
                          type="checkbox"
                          checked={step.completed}
                          onChange={() => toggleStep(release, step)}
                        />
                        <span>{step.title}</span>
                      </label>
                    ))}
                  </div>

                  <div className="info-editor">
                    <label htmlFor={`info-${release.id}`}>
                      Additional information
                    </label>
                    <textarea
                      id={`info-${release.id}`}
                      rows={2}
                      value={
                        editingInfo[release.id] ?? release.additionalInfo
                      }
                      onChange={(event) =>
                        setEditingInfo((current) => ({
                          ...current,
                          [release.id]: event.target.value,
                        }))
                      }
                      placeholder="Add release notes..."
                    />
                    <button
                      className="secondary-button"
                      onClick={() => saveInfo(release)}
                    >
                      Save information
                    </button>
                  </div>

                  <div className="card-footer">
                    <span>{progress}% complete</span>
                    <button
                      className="delete-button"
                      onClick={() => deleteRelease(release.id)}
                    >
                      Delete release
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
