import React, { useEffect, useState } from 'react';
import { Compass, ExternalLink, Loader2, MapPin, Navigation, Search } from 'lucide-react';
import { useEcoTrack } from '../context/EcoTrackContext';
import { RegionId } from '../types/carbon';

interface MapReviewSnippet {
  author?: string;
  text?: string;
  uri?: string;
}

interface MapPlaceLink {
  title: string;
  uri: string;
  placeId?: string;
  reviewSnippets?: MapReviewSnippet[];
}

type HubCategory = 'ev_charging' | 'recycling_compost' | 'solar_installers' | 'public_transit';

const CATEGORIES: { id: HubCategory; label: string }[] = [
  { id: 'ev_charging', label: 'EV Chargers' },
  { id: 'recycling_compost', label: 'Recycling & Compost' },
  { id: 'solar_installers', label: 'Solar Installers' },
  { id: 'public_transit', label: 'Transit Hubs' },
];

const REGION_DEFAULT_CITY: Record<RegionId, string> = {
  IN: 'Bengaluru, India',
  GLOBAL: 'Singapore',
  US: 'Austin, TX',
  EU: 'Berlin, Germany',
  UK: 'London, UK',
  FR: 'Paris, France',
  BR_NO: 'Oslo, Norway',
  AU: 'Melbourne, Australia',
  AFR: 'Nairobi, Kenya',
};

export const LocalEcoHubLocator: React.FC = () => {
  const { profile } = useEcoTrack();
  const [category, setCategory] = useState<HubCategory>('ev_charging');
  const [locationInput, setLocationInput] = useState(
    REGION_DEFAULT_CITY[profile.regionId] || 'Bengaluru, India'
  );
  const [locationEdited, setLocationEdited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [places, setPlaces] = useState<MapPlaceLink[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!locationEdited && !coords) {
      setLocationInput(REGION_DEFAULT_CITY[profile.regionId] || 'Bengaluru, India');
    }
  }, [coords, locationEdited, profile.regionId]);

  const runSearch = async (overrideCoords?: { lat: number; lng: number } | null, catOverride?: HubCategory) => {
    setLoading(true);
    setError(null);
    const activeCat = catOverride || category;
    const activeCoords = overrideCoords !== undefined ? overrideCoords : coords;
    try {
      const res = await fetch('/api/local-eco-hubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: activeCat,
          locationQuery: activeCoords ? undefined : locationInput,
          lat: activeCoords?.lat,
          lng: activeCoords?.lng,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Unable to retrieve nearby eco-hubs.');
      }
      setSummaryText(data.text || '');
      setPlaces(Array.isArray(data.places) ? data.places : []);
    } catch (err: any) {
      setError(err?.message || 'Unable to load nearby places right now.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported in this browser.');
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setCoords(nextCoords);
        setLocationEdited(true);
        setLocationInput(`${nextCoords.lat.toFixed(3)}, ${nextCoords.lng.toFixed(3)}`);
        void runSearch(nextCoords);
      },
      () => {
        setLoading(false);
        setError('Location permission denied. Enter a city or neighborhood instead.');
      },
      { timeout: 8000 }
    );
  };

  return (
    <section className="bento-card rounded-2xl p-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
        <div>
          <p className="text-xs font-medium text-[var(--text-muted)] mb-1">
            Nearby Clean Energy Infrastructure
          </p>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Compass className="w-5 h-5 text-[var(--accent-secondary)]" />
            <span>Local Clean Energy &amp; Transit Locator</span>
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-subtle)]">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setCategory(c.id);
                if (summaryText || places.length > 0) {
                  void runSearch(coords, c.id);
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors btn-press ${
                category === c.id
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={locationInput}
            onChange={(e) => {
              setCoords(null);
              setLocationEdited(true);
              setLocationInput(e.target.value);
            }}
            placeholder="Enter city, postal code, or neighborhood..."
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-secondary)]"
          />
        </div>

        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={loading}
          className="h-11 px-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-alt)] text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--border-strong)] flex items-center justify-center gap-2 whitespace-nowrap shrink-0 btn-press"
        >
          <Navigation className="w-4 h-4" />
          <span>Use GPS</span>
        </button>

        <button
          type="button"
          onClick={() => runSearch()}
          disabled={loading}
          className="h-11 px-5 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-xs font-semibold hover:opacity-90 flex items-center justify-center gap-2 whitespace-nowrap shrink-0 btn-press disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
          <span>{loading ? 'Searching Maps...' : 'Find Verified Hubs'}</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-600 dark:text-rose-300 mb-4">
          {error}
        </div>
      )}

      {!summaryText && !loading && !error && (
        <div className="p-5 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-subtle)] text-sm text-[var(--text-secondary)]">
          Find nearby EV fast chargers, municipal composting &amp; recycling drop-offs, rooftop solar installers, and public transit hubs around your neighborhood.
        </div>
      )}

      {summaryText && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-subtle)] text-sm leading-relaxed text-[var(--text-secondary)] whitespace-pre-line">
            {summaryText}
          </div>

          {places.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-[var(--text-muted)] mb-2.5">
                Verified Google Maps Places ({places.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {places.map((place, idx) => (
                  <div
                    key={`${place.placeId || place.title}-${idx}`}
                    className="p-3.5 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-subtle)] flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <a
                        href={place.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-[var(--text-primary)] hover:underline flex items-center gap-1.5"
                      >
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-[var(--accent-secondary)]" />
                        <span>{place.title}</span>
                      </a>
                      <a
                        href={place.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-[var(--accent-secondary)] hover:underline flex items-center gap-1 whitespace-nowrap shrink-0"
                      >
                        <span>Maps</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    {place.reviewSnippets && place.reviewSnippets.length > 0 && (
                      <div className="text-xs text-[var(--text-muted)] space-y-1">
                        {place.reviewSnippets.slice(0, 1).map((snip, sIdx) => (
                          <div key={sIdx}>
                            {snip.text && <p className="line-clamp-2">“{snip.text}”</p>}
                            {snip.uri && (
                              <a
                                href={snip.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-[var(--accent-secondary)] hover:underline inline-flex items-center gap-1 mt-0.5"
                              >
                                <span>View Review on Google Maps</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
