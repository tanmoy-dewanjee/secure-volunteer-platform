export type KnownPlace = {
  name: string;
  address: string;
  lat: number;
  lng: number;
  campus?: string;
};

export const campusPins: KnownPlace[] = [
  {
    name: "Adelaide City campus",
    address: "Adelaide University, North Terrace, Adelaide SA 5000",
    lat: -34.9205,
    lng: 138.6062,
    campus: "Adelaide City",
  },
  {
    name: "Magill campus",
    address: "Adelaide University Magill Campus, St Bernards Road, Magill SA 5072",
    lat: -34.9133,
    lng: 138.6719,
    campus: "Magill",
  },
  {
    name: "Mawson Lakes campus",
    address: "Adelaide University Mawson Lakes Campus, Mawson Lakes Blvd, Mawson Lakes SA 5095",
    lat: -34.8106,
    lng: 138.6126,
    campus: "Mawson Lakes",
  },
  {
    name: "Waite campus",
    address: "Adelaide University Waite Campus, Waite Road, Urrbrae SA 5064",
    lat: -34.9694,
    lng: 138.6358,
    campus: "Waite",
  },
  {
    name: "Roseworthy campus",
    address: "Adelaide University Roseworthy Campus, Mudla Wirra Road, Roseworthy SA 5371",
    lat: -34.5278,
    lng: 138.6886,
    campus: "Roseworthy",
  },
  {
    name: "Mount Gambier campus",
    address: "Adelaide University Mount Gambier, Wireless Road West, Mount Gambier SA 5290",
    lat: -37.8284,
    lng: 140.7804,
    campus: "Mount Gambier",
  },
  {
    name: "Whyalla campus",
    address: "Adelaide University Whyalla Campus, Nicolson Avenue, Whyalla Norrie SA 5608",
    lat: -33.038,
    lng: 137.585,
    campus: "Whyalla",
  },
];

export const namedVenues: KnownPlace[] = [
  {
    name: "Adelaide Convention Centre",
    address: "Adelaide Convention Centre, North Terrace, Adelaide SA 5000",
    lat: -34.9206,
    lng: 138.5983,
    campus: "Adelaide City",
  },
  {
    name: "Hub Central",
    address: "Hub Central, North Terrace Campus, Adelaide SA 5005",
    lat: -34.9198,
    lng: 138.6069,
    campus: "Adelaide City",
  },
  {
    name: "Barr Smith Lawns",
    address: "Barr Smith Lawns, North Terrace Campus, Adelaide SA 5005",
    lat: -34.9208,
    lng: 138.6055,
    campus: "Adelaide City",
  },
  {
    name: "Union House",
    address: "Union House, Adelaide University, Adelaide SA 5005",
    lat: -34.9194,
    lng: 138.6058,
    campus: "Adelaide City",
  },
  {
    name: "The Braggs",
    address: "The Braggs, North Terrace Campus, Adelaide SA 5005",
    lat: -34.9189,
    lng: 138.6078,
    campus: "Adelaide City",
  },
  {
    name: "Elder Park",
    address: "Elder Park, Festival Drive, Adelaide SA 5000",
    lat: -34.9174,
    lng: 138.5981,
    campus: "Adelaide City",
  },
  {
    name: "Adelaide Oval / River Torrens",
    address: "River Torrens edge, Elder Park, Adelaide SA 5000",
    lat: -34.9155,
    lng: 138.596,
    campus: "Adelaide City",
  },
  {
    name: "Park 10 sports precinct",
    address: "Park 10, War Memorial Drive, North Adelaide SA 5006",
    lat: -34.9132,
    lng: 138.6018,
    campus: "Adelaide City",
  },
  {
    name: "Foodbank SA Dry Creek",
    address: "Foodbank SA, 1-3 Churchill Road North, Dry Creek SA 5094",
    lat: -34.8342,
    lng: 138.5897,
    campus: "Adelaide City",
  },
  {
    name: "Hartley Building, Magill",
    address: "Hartley Building, Magill Campus, Magill SA 5072",
    lat: -34.9131,
    lng: 138.6726,
    campus: "Magill",
  },
  {
    name: "Mawson Lakes Building C",
    address: "Building C Atrium, Mawson Lakes Campus, Mawson Lakes SA 5095",
    lat: -34.8102,
    lng: 138.6134,
    campus: "Mawson Lakes",
  },
  {
    name: "Mawson Lakes Engineering Yard",
    address: "Engineering Yard, Mawson Lakes Campus, Mawson Lakes SA 5095",
    lat: -34.8114,
    lng: 138.6148,
    campus: "Mawson Lakes",
  },
];

const allKnown = [...campusPins, ...namedVenues];

function matchesQuery(place: KnownPlace, query: string) {
  const hay = `${place.name} ${place.address} ${place.campus ?? ""}`.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => hay.includes(token));
}

export function searchKnownPlaces(query: string, limit = 8): KnownPlace[] {
  const q = query.trim();
  if (q.length < 2) return [];
  return allKnown.filter((place) => matchesQuery(place, q)).slice(0, limit);
}

export function campusPin(campus: string) {
  return campusPins.find((place) => place.campus === campus) ?? campusPins[0];
}
