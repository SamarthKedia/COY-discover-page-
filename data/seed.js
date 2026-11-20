// Seed data for the Discover tab.
//
// `likesYou` is a SERVER-ONLY field: it marks profiles that have already liked
// the logged-in user so a match can happen during a demo. It must never be sent
// to the client — see toPublic() in lib/discover.js.

const RAW = [
  // [name, age, gender, college/city, city, bio, interests, likesYou]
  ['Aanya', 21, 'women', 'IIIT Delhi', 'Delhi', 'Will trade my playlist for your chai order. Debugging life one commit at a time.', ['indie music', 'chai', 'hackathons'], true],
  ['Kabir', 22, 'men', 'Amity University', 'Noida', 'Weekend trekker, weekday overthinker. Ask me about my failed sourdough.', ['trekking', 'baking', 'stand-up'], false],
  ['Meher', 20, 'women', 'Miranda House', 'Delhi', 'Poetry nights, thrift hauls and very strong opinions about momos.', ['poetry', 'thrifting', 'street food'], false],
  ['Arjun', 23, 'men', 'DTU', 'Delhi', 'Robotics club captain. I build things that occasionally move.', ['robotics', 'F1', 'chess'], true],
  ['Ira', 21, 'women', 'Ashoka University', 'Sonipat', 'Philosophy major who still can’t decide what to order.', ['philosophy', 'films', 'cycling'], false],
  ['Vihaan', 22, 'men', 'Galgotias University', 'Greater Noida', 'Gym at 6, code at 10, sleep never. Looking for a badminton partner.', ['badminton', 'fitness', 'anime'], false],
  ['Saanvi', 20, 'women', 'Christ University', 'Bengaluru', 'Plant mom of 14. Yes they all have names.', ['plants', 'pottery', 'K-dramas'], true],
  ['Reyansh', 24, 'men', 'BITS Pilani', 'Pilani', 'Startup intern by day, guitarist by night, bad at both.', ['guitar', 'startups', 'football'], false],
  ['Anika', 22, 'women', 'NIFT', 'Delhi', 'I will judge your shoes (kindly). Sketchbook always in my bag.', ['fashion', 'sketching', 'museums'], false],
  ['Aditya', 21, 'men', 'JIIT', 'Noida', 'Competitive programmer, casual dancer. My Codeforces rating is higher than my dance skills.', ['competitive coding', 'dance', 'gaming'], false],
  ['Myra', 23, 'women', 'SRCC', 'Delhi', 'Finance nerd who reads fantasy novels in the metro.', ['fantasy books', 'investing', 'baking'], false],
  ['Ishaan', 22, 'men', 'IIT Delhi', 'Delhi', 'Quizzing, quizzing and more quizzing. Also cats.', ['quizzing', 'cats', 'history'], true],
  ['Kiara', 21, 'women', 'Symbiosis', 'Pune', 'Film photographer. I’ll make you look good in 35mm.', ['photography', 'travel', 'jazz'], false],
  ['Rohan', 20, 'men', 'Sharda University', 'Greater Noida', 'Cricket every evening. I bowl leg-spin and talk too much.', ['cricket', 'podcasts', 'biryani'], false],
  ['Diya', 22, 'women', 'Jamia Millia Islamia', 'Delhi', 'Architecture student. I notice the buildings you walk past.', ['architecture', 'urdu poetry', 'sketching'], false],
  ['Shaurya', 23, 'men', 'NSUT', 'Delhi', 'Building an app nobody asked for. Feedback welcome.', ['product', 'running', 'sci-fi'], false],
  ['Navya', 21, 'women', 'LSR', 'Delhi', 'Debater. Will argue either side of pineapple on pizza.', ['debating', 'theatre', 'pizza'], true],
  ['Atharv', 22, 'men', 'Bennett University', 'Greater Noida', 'Music producer in a hostel room. Headphones are my personality.', ['music production', 'lo-fi', 'skating'], false],
  ['Pari', 20, 'women', 'Amity University', 'Noida', 'Dog person, sunrise person, extra-cheese person.', ['dogs', 'sunrises', 'cafes'], false],
  ['Krish', 21, 'men', 'Shiv Nadar University', 'Greater Noida', 'Astrophysics nerd. I can point out Orion from a rooftop.', ['astronomy', 'telescopes', 'chess'], false],
  ['Tara', 23, 'women', 'IIM Indore', 'Indore', 'Spreadsheets and salsa — I contain multitudes.', ['salsa', 'excel', 'travel'], false],
  ['Yash', 22, 'men', 'Manipal', 'Manipal', 'Scuba certified. Bad at swimming, great at floating.', ['scuba', 'beaches', 'photography'], true],
  ['Riya', 21, 'women', 'Galgotias College of Engineering', 'Greater Noida', 'ML student. My models overfit, my jokes don’t.', ['machine learning', 'memes', 'sketching'], false],
  ['Dev', 24, 'men', 'IIIT Hyderabad', 'Hyderabad', 'Open-source contributor. My love language is a good README.', ['open source', 'cycling', 'coffee'], false],
  ['Avni', 22, 'women', 'Hindu College', 'Delhi', 'History buff and part-time heritage walk guide.', ['history', 'walking tours', 'books'], false],
  ['Neel', 20, 'men', 'GL Bajaj', 'Greater Noida', 'Esports team lead. I promise I go outside sometimes.', ['esports', 'football', 'anime'], false],
  ['Sara', 21, 'women', 'St. Stephen’s', 'Delhi', 'Classical singer who secretly loves Punjabi pop.', ['singing', 'bhangra', 'reading'], true],
  ['Arnav', 23, 'men', 'VIT', 'Vellore', 'Hackathon addict. 14 hackathons, 3 wins, 0 sleep.', ['hackathons', 'AI', 'basketball'], false],
  ['Zoya', 22, 'women', 'Jamia Hamdard', 'Delhi', 'Med student. I will remind you to drink water.', ['medicine', 'calligraphy', 'chai'], false],
  ['Aarav', 21, 'men', 'KIIT', 'Bhubaneswar', 'Cook for friends, debate with strangers, nap anywhere.', ['cooking', 'debating', 'naps'], false],
  ['Nitya', 20, 'women', 'Delhi University', 'Delhi', 'Kathak dancer and amateur coder. Grace under (memory) pressure.', ['kathak', 'python', 'music'], false],
  ['Om', 22, 'men', 'Thapar', 'Patiala', 'Road-trip planner of the friend group. I make the playlists too.', ['road trips', 'playlists', 'photography'], false],
];

export const SEED_PROFILES = RAW.map(
  ([name, age, gender, college, city, bio, interests, likesYou], i) => ({
    id: `p${String(i + 1).padStart(2, '0')}`,
    name,
    age,
    photo: `https://randomuser.me/api/portraits/${gender}/${(i * 7 + 11) % 90}.jpg`,
    bio,
    college,
    city,
    interests,
    likesYou,
  })
);

/** Deterministic shuffle so likers aren't clustered at the top of the deck. */
function shuffled(list, seed = 7) {
  const out = [...list];
  let s = seed;
  const rand = () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function buildSeedState() {
  return {
    version: 1,
    me: { id: 'me', name: 'You' },
    profiles: shuffled(SEED_PROFILES),
    swipes: {}, // { [profileId]: { action: 'like' | 'pass', at: ISOString } }
    matches: [], // [{ profileId, matchedAt }]
  };
}
