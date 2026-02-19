import { normalize } from '../utils/normalize.js';

export const US_STATES = {
  "01":{name:"Alabama",abbr:"AL",capital:"Montgomery",region:"Southeast"},
  "02":{name:"Alaska",abbr:"AK",capital:"Juneau",region:"West"},
  "04":{name:"Arizona",abbr:"AZ",capital:"Phoenix",region:"Southwest"},
  "05":{name:"Arkansas",abbr:"AR",capital:"Little Rock",region:"Southeast"},
  "06":{name:"California",abbr:"CA",capital:"Sacramento",region:"West"},
  "08":{name:"Colorado",abbr:"CO",capital:"Denver",region:"West"},
  "09":{name:"Connecticut",abbr:"CT",capital:"Hartford",region:"Northeast"},
  "10":{name:"Delaware",abbr:"DE",capital:"Dover",region:"Northeast"},
  "11":{name:"District of Columbia",abbr:"DC",capital:"Washington",region:"Northeast"},
  "12":{name:"Florida",abbr:"FL",capital:"Tallahassee",region:"Southeast"},
  "13":{name:"Georgia",abbr:"GA",capital:"Atlanta",region:"Southeast"},
  "15":{name:"Hawaii",abbr:"HI",capital:"Honolulu",region:"West"},
  "16":{name:"Idaho",abbr:"ID",capital:"Boise",region:"West"},
  "17":{name:"Illinois",abbr:"IL",capital:"Springfield",region:"Midwest"},
  "18":{name:"Indiana",abbr:"IN",capital:"Indianapolis",region:"Midwest"},
  "19":{name:"Iowa",abbr:"IA",capital:"Des Moines",region:"Midwest"},
  "20":{name:"Kansas",abbr:"KS",capital:"Topeka",region:"Midwest"},
  "21":{name:"Kentucky",abbr:"KY",capital:"Frankfort",region:"Southeast"},
  "22":{name:"Louisiana",abbr:"LA",capital:"Baton Rouge",region:"Southeast"},
  "23":{name:"Maine",abbr:"ME",capital:"Augusta",region:"Northeast"},
  "24":{name:"Maryland",abbr:"MD",capital:"Annapolis",region:"Northeast"},
  "25":{name:"Massachusetts",abbr:"MA",capital:"Boston",region:"Northeast"},
  "26":{name:"Michigan",abbr:"MI",capital:"Lansing",region:"Midwest"},
  "27":{name:"Minnesota",abbr:"MN",capital:"Saint Paul",region:"Midwest"},
  "28":{name:"Mississippi",abbr:"MS",capital:"Jackson",region:"Southeast"},
  "29":{name:"Missouri",abbr:"MO",capital:"Jefferson City",region:"Midwest"},
  "30":{name:"Montana",abbr:"MT",capital:"Helena",region:"West"},
  "31":{name:"Nebraska",abbr:"NE",capital:"Lincoln",region:"Midwest"},
  "32":{name:"Nevada",abbr:"NV",capital:"Carson City",region:"West"},
  "33":{name:"New Hampshire",abbr:"NH",capital:"Concord",region:"Northeast"},
  "34":{name:"New Jersey",abbr:"NJ",capital:"Trenton",region:"Northeast"},
  "35":{name:"New Mexico",abbr:"NM",capital:"Santa Fe",region:"Southwest"},
  "36":{name:"New York",abbr:"NY",capital:"Albany",region:"Northeast"},
  "37":{name:"North Carolina",abbr:"NC",capital:"Raleigh",region:"Southeast"},
  "38":{name:"North Dakota",abbr:"ND",capital:"Bismarck",region:"Midwest"},
  "39":{name:"Ohio",abbr:"OH",capital:"Columbus",region:"Midwest"},
  "40":{name:"Oklahoma",abbr:"OK",capital:"Oklahoma City",region:"Southwest"},
  "41":{name:"Oregon",abbr:"OR",capital:"Salem",region:"West"},
  "42":{name:"Pennsylvania",abbr:"PA",capital:"Harrisburg",region:"Northeast"},
  "44":{name:"Rhode Island",abbr:"RI",capital:"Providence",region:"Northeast"},
  "45":{name:"South Carolina",abbr:"SC",capital:"Columbia",region:"Southeast"},
  "46":{name:"South Dakota",abbr:"SD",capital:"Pierre",region:"Midwest"},
  "47":{name:"Tennessee",abbr:"TN",capital:"Nashville",region:"Southeast"},
  "48":{name:"Texas",abbr:"TX",capital:"Austin",region:"Southwest"},
  "49":{name:"Utah",abbr:"UT",capital:"Salt Lake City",region:"West"},
  "50":{name:"Vermont",abbr:"VT",capital:"Montpelier",region:"Northeast"},
  "51":{name:"Virginia",abbr:"VA",capital:"Richmond",region:"Southeast"},
  "53":{name:"Washington",abbr:"WA",capital:"Olympia",region:"West"},
  "54":{name:"West Virginia",abbr:"WV",capital:"Charleston",region:"Southeast"},
  "55":{name:"Wisconsin",abbr:"WI",capital:"Madison",region:"Midwest"},
  "56":{name:"Wyoming",abbr:"WY",capital:"Cheyenne",region:"West"}
};

export const US_REGION_COLORS = {"Northeast":"#3b82f6","Southeast":"#f97316","Midwest":"#22c55e","Southwest":"#eab308","West":"#a855f7"};
export const US_REGION_ICONS = {"Northeast":"\ud83d\uddfd","Southeast":"\ud83c\udf3a","Midwest":"\ud83c\udf3d","Southwest":"\ud83c\udf35","West":"\ud83c\udfd4\ufe0f"};

export const US_ALIASES = {};
Object.entries(US_STATES).forEach(([id, s]) => {
  US_ALIASES[normalize(s.name)] = id;
  US_ALIASES[normalize(s.abbr)] = id;
});

// Manual aliases
US_ALIASES[normalize("Nova York")] = "36";
US_ALIASES[normalize("Nova Iorque")] = "36";
US_ALIASES[normalize("Carolina do Norte")] = "37";
US_ALIASES[normalize("Carolina do Sul")] = "45";
US_ALIASES[normalize("Dakota do Norte")] = "38";
US_ALIASES[normalize("Dakota do Sul")] = "46";
US_ALIASES[normalize("Novo Mexico")] = "35";
US_ALIASES[normalize("Nova Jersey")] = "34";
US_ALIASES[normalize("Virg\u00ednia")] = "51";
US_ALIASES[normalize("Virginia")] = "51";
US_ALIASES[normalize("Virg\u00ednia Ocidental")] = "54";
US_ALIASES[normalize("Virginia Ocidental")] = "54";
US_ALIASES[normalize("West Virginia")] = "54";
US_ALIASES[normalize("Havai")] = "15";
US_ALIASES[normalize("Hava\u00ed")] = "15";
US_ALIASES[normalize("Pensilv\u00e2nia")] = "42";
US_ALIASES[normalize("Pensilvania")] = "42";
US_ALIASES[normalize("Massachussets")] = "25";
US_ALIASES[normalize("Massachussetts")] = "25";
US_ALIASES[normalize("Conecticut")] = "09";
US_ALIASES[normalize("Rode Island")] = "44";
US_ALIASES[normalize("Distrito de Columbia")] = "11";
US_ALIASES[normalize("DC")] = "11";
US_ALIASES[normalize("Luisiana")] = "22";
US_ALIASES[normalize("Wiscosin")] = "55";

export const US_FLAG_EXCEPTIONS = {"13":"Flag_of_Georgia_(U.S._state).svg"};

export function getStateFlagURL(country, id, brFlagFiles) {
  let filename;
  if (country === "BR") {
    filename = brFlagFiles[id];
  } else {
    filename = US_FLAG_EXCEPTIONS[id] || `Flag_of_${US_STATES[id]?.name.replace(/ /g,'_')}.svg`;
  }
  if (!filename) return null;
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=640`;
}

export const US_CAPITAL_ALIASES = {};
Object.entries(US_STATES).forEach(([id, s]) => { US_CAPITAL_ALIASES[normalize(s.capital)] = id; });
// Manual capital aliases
US_CAPITAL_ALIASES[normalize("Saint Paul")] = "27";
US_CAPITAL_ALIASES[normalize("Sao Paulo")] = "27";
US_CAPITAL_ALIASES[normalize("Salt Lake")] = "49";
US_CAPITAL_ALIASES[normalize("Oklahoma")] = "40";
US_CAPITAL_ALIASES[normalize("Jefferson")] = "29";
US_CAPITAL_ALIASES[normalize("Des Moines")] = "19";
US_CAPITAL_ALIASES[normalize("Baton Rouge")] = "22";
US_CAPITAL_ALIASES[normalize("Little Rock")] = "05";
US_CAPITAL_ALIASES[normalize("Carson")] = "32";
