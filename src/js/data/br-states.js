import { normalize } from '../utils/normalize.js';

export const BR_STATES = {
  "11":{name:"Rond\u00f4nia",abbr:"RO",capital:"Porto Velho",region:"Norte"},
  "12":{name:"Acre",abbr:"AC",capital:"Rio Branco",region:"Norte"},
  "13":{name:"Amazonas",abbr:"AM",capital:"Manaus",region:"Norte"},
  "14":{name:"Roraima",abbr:"RR",capital:"Boa Vista",region:"Norte"},
  "15":{name:"Par\u00e1",abbr:"PA",capital:"Bel\u00e9m",region:"Norte"},
  "16":{name:"Amap\u00e1",abbr:"AP",capital:"Macap\u00e1",region:"Norte"},
  "17":{name:"Tocantins",abbr:"TO",capital:"Palmas",region:"Norte"},
  "21":{name:"Maranh\u00e3o",abbr:"MA",capital:"S\u00e3o Lu\u00eds",region:"Nordeste"},
  "22":{name:"Piau\u00ed",abbr:"PI",capital:"Teresina",region:"Nordeste"},
  "23":{name:"Cear\u00e1",abbr:"CE",capital:"Fortaleza",region:"Nordeste"},
  "24":{name:"Rio Grande do Norte",abbr:"RN",capital:"Natal",region:"Nordeste"},
  "25":{name:"Para\u00edba",abbr:"PB",capital:"Jo\u00e3o Pessoa",region:"Nordeste"},
  "26":{name:"Pernambuco",abbr:"PE",capital:"Recife",region:"Nordeste"},
  "27":{name:"Alagoas",abbr:"AL",capital:"Macei\u00f3",region:"Nordeste"},
  "28":{name:"Sergipe",abbr:"SE",capital:"Aracaju",region:"Nordeste"},
  "29":{name:"Bahia",abbr:"BA",capital:"Salvador",region:"Nordeste"},
  "31":{name:"Minas Gerais",abbr:"MG",capital:"Belo Horizonte",region:"Sudeste"},
  "32":{name:"Esp\u00edrito Santo",abbr:"ES",capital:"Vit\u00f3ria",region:"Sudeste"},
  "33":{name:"Rio de Janeiro",abbr:"RJ",capital:"Rio de Janeiro",region:"Sudeste"},
  "35":{name:"S\u00e3o Paulo",abbr:"SP",capital:"S\u00e3o Paulo",region:"Sudeste"},
  "41":{name:"Paran\u00e1",abbr:"PR",capital:"Curitiba",region:"Sul"},
  "42":{name:"Santa Catarina",abbr:"SC",capital:"Florian\u00f3polis",region:"Sul"},
  "43":{name:"Rio Grande do Sul",abbr:"RS",capital:"Porto Alegre",region:"Sul"},
  "50":{name:"Mato Grosso do Sul",abbr:"MS",capital:"Campo Grande",region:"Centro-Oeste"},
  "51":{name:"Mato Grosso",abbr:"MT",capital:"Cuiab\u00e1",region:"Centro-Oeste"},
  "52":{name:"Goi\u00e1s",abbr:"GO",capital:"Goi\u00e2nia",region:"Centro-Oeste"},
  "53":{name:"Distrito Federal",abbr:"DF",capital:"Bras\u00edlia",region:"Centro-Oeste"}
};

export const BR_REGION_COLORS = {"Norte":"#22c55e","Nordeste":"#f97316","Centro-Oeste":"#eab308","Sudeste":"#3b82f6","Sul":"#a855f7"};
export const BR_REGION_ICONS = {"Norte":"\ud83c\udf3f","Nordeste":"\u2600\ufe0f","Centro-Oeste":"\ud83c\udf3e","Sudeste":"\ud83c\udfd9\ufe0f","Sul":"\u2744\ufe0f"};

export const BR_ALIASES = {};

// Build from state names and abbreviations
Object.entries(BR_STATES).forEach(([id, s]) => {
  BR_ALIASES[normalize(s.name)] = id;
  BR_ALIASES[normalize(s.abbr)] = id;
});

// Manual aliases
BR_ALIASES[normalize("Rondonia")] = "11";
BR_ALIASES[normalize("Amapa")] = "16";
BR_ALIASES[normalize("Para")] = "15";
BR_ALIASES[normalize("Maranhao")] = "21";
BR_ALIASES[normalize("Piaui")] = "22";
BR_ALIASES[normalize("Ceara")] = "23";
BR_ALIASES[normalize("Paraiba")] = "25";
BR_ALIASES[normalize("Espirito Santo")] = "32";
BR_ALIASES[normalize("Sao Paulo")] = "35";
BR_ALIASES[normalize("Parana")] = "41";
BR_ALIASES[normalize("Goias")] = "52";
BR_ALIASES[normalize("Mato Grosso do Sul")] = "50";
BR_ALIASES[normalize("Rio Grande do Norte")] = "24";
BR_ALIASES[normalize("Rio Grande do Sul")] = "43";
BR_ALIASES[normalize("Santa Catarina")] = "42";
BR_ALIASES[normalize("Minas")] = "31";

export const BR_FLAG_FILES = {
  "11":"Bandeira_de_Rond\u00f4nia.svg","12":"Bandeira_do_Acre.svg","13":"Bandeira_do_Amazonas.svg",
  "14":"Bandeira_de_Roraima.svg","15":"Bandeira_do_Par\u00e1.svg","16":"Bandeira_do_Amap\u00e1.svg",
  "17":"Bandeira_do_Tocantins.svg","21":"Bandeira_do_Maranh\u00e3o.svg","22":"Bandeira_do_Piau\u00ed.svg",
  "23":"Bandeira_do_Cear\u00e1.svg","24":"Bandeira_do_Rio_Grande_do_Norte.svg","25":"Bandeira_da_Para\u00edba.svg",
  "26":"Bandeira_de_Pernambuco.svg","27":"Bandeira_de_Alagoas.svg","28":"Bandeira_de_Sergipe.svg",
  "29":"Bandeira_da_Bahia.svg","31":"Bandeira_de_Minas_Gerais.svg","32":"Bandeira_do_Esp\u00edrito_Santo.svg",
  "33":"Bandeira_do_estado_do_Rio_de_Janeiro.svg","35":"Bandeira_do_estado_de_S\u00e3o_Paulo.svg",
  "41":"Bandeira_do_Paran\u00e1.svg","42":"Bandeira_de_Santa_Catarina.svg","43":"Bandeira_do_Rio_Grande_do_Sul.svg",
  "50":"Bandeira_de_Mato_Grosso_do_Sul.svg","51":"Bandeira_de_Mato_Grosso.svg",
  "52":"Bandeira_de_Goi\u00e1s.svg","53":"Bandeira_do_Distrito_Federal_(Brasil).svg"
};

export const BR_CAPITAL_ALIASES = {};
Object.entries(BR_STATES).forEach(([id, s]) => { BR_CAPITAL_ALIASES[normalize(s.capital)] = id; });
// Manual capital aliases
BR_CAPITAL_ALIASES[normalize("Joao Pessoa")] = "25";
BR_CAPITAL_ALIASES[normalize("Sao Luis")] = "21";
BR_CAPITAL_ALIASES[normalize("Sao Paulo")] = "35";
BR_CAPITAL_ALIASES[normalize("Belem")] = "15";
BR_CAPITAL_ALIASES[normalize("Macapa")] = "16";
BR_CAPITAL_ALIASES[normalize("Cuiaba")] = "51";
BR_CAPITAL_ALIASES[normalize("Goiania")] = "52";
BR_CAPITAL_ALIASES[normalize("Brasilia")] = "53";
BR_CAPITAL_ALIASES[normalize("Florianopolis")] = "42";
BR_CAPITAL_ALIASES[normalize("Vitoria")] = "32";
BR_CAPITAL_ALIASES[normalize("Maceio")] = "27";
BR_CAPITAL_ALIASES[normalize("BH")] = "31";
BR_CAPITAL_ALIASES[normalize("Belo Horizonte")] = "31";
BR_CAPITAL_ALIASES[normalize("Palmas")] = "17";
BR_CAPITAL_ALIASES[normalize("Boa Vista")] = "14";
BR_CAPITAL_ALIASES[normalize("Rio Branco")] = "12";
BR_CAPITAL_ALIASES[normalize("Porto Velho")] = "11";
BR_CAPITAL_ALIASES[normalize("Porto Alegre")] = "43";
