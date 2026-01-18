// import { LeadI } from "../../types";

// export interface ProfileData {
//   id?: string;
//   name: string;
//   headline?: string;
//   profileUrl: string;
//   source: 'comments' | 'reactions' | 'reposts';
// }

// const scrapedProfiles: Map<string, LeadI> = new Map();
// const listeners: ((profiles: LeadI[]) => void)[] = [];

// export function addProfiles(profiles: LeadI[]) {
//   let changed = false;
//   for (const profile of profiles) {
//     const key = normalizeKey(profile.profileLink);
//     if (!scrapedProfiles.has(key)) {
//       scrapedProfiles.set(key, profile);
//       changed = true;
//     }
//   }
//   if (changed) notifyListeners();
// }

// export function getAllProfiles(): LeadI[] {
//   return Array.from(scrapedProfiles.values());
// }

// export function subscribeToProfiles(listener: (profiles: LeadI[]) => void) {
//   listeners.push(listener);
//   // initial push
//   listener(getAllProfiles());
//   return () => {
//     const idx = listeners.indexOf(listener);
//     if (idx !== -1) listeners.splice(idx, 1);
//   };
// }

// function notifyListeners() {
//   const profiles = getAllProfiles();
//   for (const fn of listeners) fn(profiles);
// }

// function normalizeKey(url: string) {
//   try {
//     const u = new URL(url);
//     return u.pathname.replace(/\/$/, '').toLowerCase();
//   } catch {
//     return url.trim().toLowerCase();
//   }
// }

// export function clearProfiles() {
//   scrapedProfiles.clear();
//   notifyListeners();
// }