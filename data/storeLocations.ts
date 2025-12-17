// Lowe's Store locations from maps.xlsx
// Stores need to be geocoded to get coordinates

export interface StoreLocation {
  address: string
  city: string
  state: string
  zip: string
  name: string
  number: string
  workroom: string
  fullAddress: string
}

export const storeLocations: StoreLocation[] = [
  {
    address: "7117 BROAD STREET",
    city: "Brooksville",
    state: "FL",
    zip: "34601-5536",
    name: "LOWE'S OF BROOKSVILLE, FL",
    number: "1827",
    workroom: "Ocala",
    fullAddress: "7117 BROAD STREET, Brooksville, FL 34601-5536"
  },
  {
    address: "9540 US HWY 441 LEESBURG FL",
    city: "Leesburg",
    state: "FL",
    zip: "34788-3948",
    name: "LOWE'S OF LAKE COUNTY, FL",
    number: "569",
    workroom: "Ocala",
    fullAddress: "9540 US HWY 441 LEESBURG FL, Leesburg, FL 34788-3948"
  },
  {
    address: "18795 US HIGHWAY 441",
    city: "Mt.Dora",
    state: "FL",
    zip: "32757-6741",
    name: "LOWE'S OF MT. DORA, FL",
    number: "2577",
    workroom: "Ocala",
    fullAddress: "18795 US HIGHWAY 441, Mt.Dora, FL 32757-6741"
  },
  {
    address: "5630 SEVEN MILE DRIVE",
    city: "Wildwood",
    state: "FL",
    zip: "34785",
    name: "LOWE'S OF WILDWOOD, FL",
    number: "3351",
    workroom: "Ocala",
    fullAddress: "5630 SEVEN MILE DRIVE, Wildwood, FL 34785"
  },
  {
    address: "4780 COMMERCIAL WAY",
    city: "Spring Hill",
    state: "FL",
    zip: "34606-1925",
    name: "LOWE'S OF SPRING HILL, FL",
    number: "1605",
    workroom: "Ocala",
    fullAddress: "4780 COMMERCIAL WAY, Spring Hill, FL 34606-1925"
  },
  {
    address: "13705 US HIGWAY 441",
    city: "LADY LAKE",
    state: "FL",
    zip: "32159-8981",
    name: "LOWE'S OF LADY LAKE, FL",
    number: "1685",
    workroom: "Ocala",
    fullAddress: "13705 US HIGWAY 441, LADY LAKE, FL 32159-8981"
  },
  {
    address: "2301 EAST GULF TO LAKE HWY",
    city: "Inverness",
    state: "FL",
    zip: "34453-3218",
    name: "LOWE'S OF INVERNESS, FL",
    number: "1853",
    workroom: "Ocala",
    fullAddress: "2301 EAST GULF TO LAKE HWY, Inverness, FL 34453-3218"
  },
  {
    address: "7575 SW 90TH STREET",
    city: "Ocala",
    state: "FL",
    zip: "34476",
    name: "LOWE'S OF S.W. MARION COUNTY, FL",
    number: "2753",
    workroom: "Ocala",
    fullAddress: "7575 SW 90TH STREET, Ocala, FL 34476"
  },
  {
    address: "3535 SW 36TH AVE.",
    city: "Ocala",
    state: "FL",
    zip: "34474-4474",
    name: "LOWE'S OF OCALA, FL",
    number: "440",
    workroom: "Ocala",
    fullAddress: "3535 SW 36TH AVE., Ocala, FL 34474-4474"
  },
  {
    address: "4600 EAST SILVER SPRINGS BLVD",
    city: "Ocala",
    state: "FL",
    zip: "34470-3204",
    name: "LOWE'S OF E. OCALA, FL",
    number: "1855",
    workroom: "Ocala",
    fullAddress: "4600 EAST SILVER SPRINGS BLVD, Ocala, FL 34470-3204"
  },
  {
    address: "2564 NW 13TH STREET",
    city: "Gainesville",
    state: "FL",
    zip: "32609",
    name: "LOWE'S OF S.W. GAINESVILLE,FL",
    number: "3278",
    workroom: "Gainesville",
    fullAddress: "2564 NW 13TH STREET, Gainesville, FL 32609"
  },
  {
    address: "15910 NW 144 TERRACE",
    city: "Alachua",
    state: "FL",
    zip: "32615-9368",
    name: "LOWE'S OF ALACHUA, FL",
    number: "2984",
    workroom: "Gainesville",
    fullAddress: "15910 NW 144 TERRACE, Alachua, FL 32615-9368"
  },
  {
    address: "3463 NW BASCOM NORRIS DRIVE LAKE CITY FL 32055-4712",
    city: "Lake City",
    state: "FL",
    zip: "32055-4712",
    name: "LOWE'S OF LAKE CITY, FL",
    number: "179",
    workroom: "Gainesville",
    fullAddress: "3463 NW BASCOM NORRIS DRIVE LAKE CITY FL 32055-4712, Lake City, FL 32055-4712"
  },
  {
    address: "208 72ND TRCE NE",
    city: "Live Oak",
    state: "FL",
    zip: "32064-4842",
    name: "LOWE'S OF LIVE OAK, FL",
    number: "2462",
    workroom: "Gainesville",
    fullAddress: "208 72ND TRCE NE, Live Oak, FL 32064-4842"
  },
  {
    address: "2121 NE CAPITAL CIRCLE",
    city: "Tallahassee",
    state: "FL",
    zip: "32308-4303",
    name: "LOWE'S OF NE TALLAHASSEE, FL",
    number: "417",
    workroom: "Tallahassee",
    fullAddress: "2121 NE CAPITAL CIRCLE, Tallahassee, FL 32308-4303"
  },
  {
    address: "5500 COMMONWEALTH BLVD",
    city: "Tallahassee",
    state: "FL",
    zip: "32303-1323",
    name: "LOWE'S OF N.W. TALLAHASSEE, FL",
    number: "716",
    workroom: "Tallahassee",
    fullAddress: "5500 COMMONWEALTH BLVD, Tallahassee, FL 32303-1323"
  },
  {
    address: "13911 U.S. HIGHWAY 19 SOUTH",
    city: "Thomasville",
    state: "FL",
    zip: "31792-5395",
    name: "LOWE'S OF THOMASVILLE, GA",
    number: "1564",
    workroom: "Albany",
    fullAddress: "13911 U.S. HIGHWAY 19 SOUTH, Thomasville, FL 31792-5395"
  },
  {
    address: "1200 NORTH WESTOVER BLVD.",
    city: "Albany",
    state: "GA",
    zip: "31707-6601",
    name: "LOWE'S OF ALBANY, GA.",
    number: "492",
    workroom: "Albany",
    fullAddress: "1200 NORTH WESTOVER BLVD., Albany, GA 31707-6601"
  },
  {
    address: "602 VETERAN'S PARKWAY N",
    city: "Moultrie",
    state: "FL",
    zip: "31788-4122",
    name: "LOWE'S OF MOULTRIE, GA",
    number: "2621",
    workroom: "Albany",
    fullAddress: "602 VETERAN'S PARKWAY N, Moultrie, FL 31788-4122"
  },
  {
    address: "4860 MALLOY PLAZA",
    city: "Marianna",
    state: "FL",
    zip: "32448-2559",
    name: "LOWE'S OF MARIANNA, FL",
    number: "1924",
    workroom: "Panama City",
    fullAddress: "4860 MALLOY PLAZA, Marianna, FL 32448-2559"
  },
  {
    address: "300 EAST 23RD ST.",
    city: "Panama City",
    state: "FL",
    zip: "32405-4523",
    name: "LOWE'S OF PANAMA CITY, FL",
    number: "448",
    workroom: "Panama City",
    fullAddress: "300 EAST 23RD ST., Panama City, FL 32405-4523"
  },
  {
    address: "11751 PANAMA CITY BEACH PKWY",
    city: "Panama City Beach",
    state: "FL",
    zip: "32407-2507",
    name: "LOWE'S OF PANAMA CITY BEACH, FL",
    number: "2367",
    workroom: "Panama City",
    fullAddress: "11751 PANAMA CITY BEACH PKWY, Panama City Beach, FL 32407-2507"
  },
  {
    address: "2671 ROSS CLARK CIRCLE",
    city: "Dothan",
    state: "AL",
    zip: "36301-4905",
    name: "LOWE'S OF DOTHAN, AL",
    number: "606",
    workroom: "Dothan",
    fullAddress: "2671 ROSS CLARK CIRCLE, Dothan, AL 36301-4905"
  },
  {
    address: "7117 BROAD STREET",
    city: "Brooksville",
    state: "FL",
    zip: "34601-5536",
    name: "LOWE'S OF BROOKSVILLE, FL",
    number: "1827",
    workroom: "Ocala",
    fullAddress: "7117 BROAD STREET, Brooksville, FL 34601-5536"
  },
  {
    address: "9540 US HWY 441 LEESBURG FL",
    city: "Leesburg",
    state: "FL",
    zip: "34788-3948",
    name: "LOWE'S OF LAKE COUNTY, FL",
    number: "569",
    workroom: "Ocala",
    fullAddress: "9540 US HWY 441 LEESBURG FL, Leesburg, FL 34788-3948"
  },
  {
    address: "18795 US HIGHWAY 441",
    city: "Mt.Dora",
    state: "FL",
    zip: "32757-6741",
    name: "LOWE'S OF MT. DORA, FL",
    number: "2577",
    workroom: "Ocala",
    fullAddress: "18795 US HIGHWAY 441, Mt.Dora, FL 32757-6741"
  },
  {
    address: "5630 SEVEN MILE DRIVE",
    city: "Wildwood",
    state: "FL",
    zip: "34785",
    name: "LOWE'S OF WILDWOOD, FL",
    number: "3351",
    workroom: "Ocala",
    fullAddress: "5630 SEVEN MILE DRIVE, Wildwood, FL 34785"
  },
  {
    address: "4780 COMMERCIAL WAY",
    city: "Spring Hill",
    state: "FL",
    zip: "34606-1925",
    name: "LOWE'S OF SPRING HILL, FL",
    number: "1605",
    workroom: "Ocala",
    fullAddress: "4780 COMMERCIAL WAY, Spring Hill, FL 34606-1925"
  },
  {
    address: "13705 US HIGWAY 441",
    city: "LADY LAKE",
    state: "FL",
    zip: "32159-8981",
    name: "LOWE'S OF LADY LAKE, FL",
    number: "1685",
    workroom: "Ocala",
    fullAddress: "13705 US HIGWAY 441, LADY LAKE, FL 32159-8981"
  },
  {
    address: "2301 EAST GULF TO LAKE HWY",
    city: "Inverness",
    state: "FL",
    zip: "34453-3218",
    name: "LOWE'S OF INVERNESS, FL",
    number: "1853",
    workroom: "Ocala",
    fullAddress: "2301 EAST GULF TO LAKE HWY, Inverness, FL 34453-3218"
  },
  {
    address: "7575 SW 90TH STREET",
    city: "Ocala",
    state: "FL",
    zip: "34476",
    name: "LOWE'S OF S.W. MARION COUNTY, FL",
    number: "2753",
    workroom: "Ocala",
    fullAddress: "7575 SW 90TH STREET, Ocala, FL 34476"
  },
  {
    address: "3535 SW 36TH AVE.",
    city: "Ocala",
    state: "FL",
    zip: "34474-4474",
    name: "LOWE'S OF OCALA, FL",
    number: "440",
    workroom: "Ocala",
    fullAddress: "3535 SW 36TH AVE., Ocala, FL 34474-4474"
  },
  {
    address: "4600 EAST SILVER SPRINGS BLVD",
    city: "Ocala",
    state: "FL",
    zip: "34470-3204",
    name: "LOWE'S OF E. OCALA, FL",
    number: "1855",
    workroom: "Ocala",
    fullAddress: "4600 EAST SILVER SPRINGS BLVD, Ocala, FL 34470-3204"
  },
  {
    address: "2564 NW 13TH STREET",
    city: "Gainesville",
    state: "FL",
    zip: "32609",
    name: "LOWE'S OF S.W. GAINESVILLE,FL",
    number: "3278",
    workroom: "Gainesville",
    fullAddress: "2564 NW 13TH STREET, Gainesville, FL 32609"
  },
  {
    address: "15910 NW 144 TERRACE",
    city: "Alachua",
    state: "FL",
    zip: "32615-9368",
    name: "LOWE'S OF ALACHUA, FL",
    number: "2984",
    workroom: "Gainesville",
    fullAddress: "15910 NW 144 TERRACE, Alachua, FL 32615-9368"
  },
  {
    address: "3463 NW BASCOM NORRIS DRIVE LAKE CITY FL 32055-4712",
    city: "Lake City",
    state: "FL",
    zip: "32055-4712",
    name: "LOWE'S OF LAKE CITY, FL",
    number: "179",
    workroom: "Gainesville",
    fullAddress: "3463 NW BASCOM NORRIS DRIVE LAKE CITY FL 32055-4712, Lake City, FL 32055-4712"
  },
  {
    address: "208 72ND TRCE NE",
    city: "Live Oak",
    state: "FL",
    zip: "32064-4842",
    name: "LOWE'S OF LIVE OAK, FL",
    number: "2462",
    workroom: "Gainesville",
    fullAddress: "208 72ND TRCE NE, Live Oak, FL 32064-4842"
  },
  {
    address: "2121 NE CAPITAL CIRCLE",
    city: "Tallahassee",
    state: "FL",
    zip: "32308-4303",
    name: "LOWE'S OF NE TALLAHASSEE, FL",
    number: "417",
    workroom: "Tallahassee",
    fullAddress: "2121 NE CAPITAL CIRCLE, Tallahassee, FL 32308-4303"
  },
  {
    address: "5500 COMMONWEALTH BLVD",
    city: "Tallahassee",
    state: "FL",
    zip: "32303-1323",
    name: "LOWE'S OF N.W. TALLAHASSEE, FL",
    number: "716",
    workroom: "Tallahassee",
    fullAddress: "5500 COMMONWEALTH BLVD, Tallahassee, FL 32303-1323"
  },
  {
    address: "13911 U.S. HIGHWAY 19 SOUTH",
    city: "Thomasville",
    state: "FL",
    zip: "31792-5395",
    name: "LOWE'S OF THOMASVILLE, GA",
    number: "1564",
    workroom: "Albany",
    fullAddress: "13911 U.S. HIGHWAY 19 SOUTH, Thomasville, FL 31792-5395"
  },
  {
    address: "1200 NORTH WESTOVER BLVD.",
    city: "Albany",
    state: "GA",
    zip: "31707-6601",
    name: "LOWE'S OF ALBANY, GA.",
    number: "492",
    workroom: "Albany",
    fullAddress: "1200 NORTH WESTOVER BLVD., Albany, GA 31707-6601"
  },
  {
    address: "602 VETERAN'S PARKWAY N",
    city: "Moultrie",
    state: "FL",
    zip: "31788-4122",
    name: "LOWE'S OF MOULTRIE, GA",
    number: "2621",
    workroom: "Albany",
    fullAddress: "602 VETERAN'S PARKWAY N, Moultrie, FL 31788-4122"
  },
  {
    address: "4860 MALLOY PLAZA",
    city: "Marianna",
    state: "FL",
    zip: "32448-2559",
    name: "LOWE'S OF MARIANNA, FL",
    number: "1924",
    workroom: "Panama City",
    fullAddress: "4860 MALLOY PLAZA, Marianna, FL 32448-2559"
  },
  {
    address: "300 EAST 23RD ST.",
    city: "Panama City",
    state: "FL",
    zip: "32405-4523",
    name: "LOWE'S OF PANAMA CITY, FL",
    number: "448",
    workroom: "Panama City",
    fullAddress: "300 EAST 23RD ST., Panama City, FL 32405-4523"
  },
  {
    address: "11751 PANAMA CITY BEACH PKWY",
    city: "Panama City Beach",
    state: "FL",
    zip: "32407-2507",
    name: "LOWE'S OF PANAMA CITY BEACH, FL",
    number: "2367",
    workroom: "Panama City",
    fullAddress: "11751 PANAMA CITY BEACH PKWY, Panama City Beach, FL 32407-2507"
  },
  {
    address: "2671 ROSS CLARK CIRCLE",
    city: "Dothan",
    state: "AL",
    zip: "36301-4905",
    name: "LOWE'S OF DOTHAN, AL",
    number: "606",
    workroom: "Dothan",
    fullAddress: "2671 ROSS CLARK CIRCLE, Dothan, AL 36301-4905"
  },
  {
    address: "7117 BROAD STREET",
    city: "Brooksville",
    state: "FL",
    zip: "34601-5536",
    name: "LOWE'S OF BROOKSVILLE, FL",
    number: "1827",
    workroom: "Ocala",
    fullAddress: "7117 BROAD STREET, Brooksville, FL 34601-5536"
  },
  {
    address: "9540 US HWY 441 LEESBURG FL",
    city: "Leesburg",
    state: "FL",
    zip: "34788-3948",
    name: "LOWE'S OF LAKE COUNTY, FL",
    number: "569",
    workroom: "Ocala",
    fullAddress: "9540 US HWY 441 LEESBURG FL, Leesburg, FL 34788-3948"
  },
  {
    address: "18795 US HIGHWAY 441",
    city: "Mt.Dora",
    state: "FL",
    zip: "32757-6741",
    name: "LOWE'S OF MT. DORA, FL",
    number: "2577",
    workroom: "Ocala",
    fullAddress: "18795 US HIGHWAY 441, Mt.Dora, FL 32757-6741"
  },
  {
    address: "5630 SEVEN MILE DRIVE",
    city: "Wildwood",
    state: "FL",
    zip: "34785",
    name: "LOWE'S OF WILDWOOD, FL",
    number: "3351",
    workroom: "Ocala",
    fullAddress: "5630 SEVEN MILE DRIVE, Wildwood, FL 34785"
  },
  {
    address: "4780 COMMERCIAL WAY",
    city: "Spring Hill",
    state: "FL",
    zip: "34606-1925",
    name: "LOWE'S OF SPRING HILL, FL",
    number: "1605",
    workroom: "Ocala",
    fullAddress: "4780 COMMERCIAL WAY, Spring Hill, FL 34606-1925"
  },
  {
    address: "13705 US HIGWAY 441",
    city: "LADY LAKE",
    state: "FL",
    zip: "32159-8981",
    name: "LOWE'S OF LADY LAKE, FL",
    number: "1685",
    workroom: "Ocala",
    fullAddress: "13705 US HIGWAY 441, LADY LAKE, FL 32159-8981"
  },
  {
    address: "2301 EAST GULF TO LAKE HWY",
    city: "Inverness",
    state: "FL",
    zip: "34453-3218",
    name: "LOWE'S OF INVERNESS, FL",
    number: "1853",
    workroom: "Ocala",
    fullAddress: "2301 EAST GULF TO LAKE HWY, Inverness, FL 34453-3218"
  },
  {
    address: "7575 SW 90TH STREET",
    city: "Ocala",
    state: "FL",
    zip: "34476",
    name: "LOWE'S OF S.W. MARION COUNTY, FL",
    number: "2753",
    workroom: "Ocala",
    fullAddress: "7575 SW 90TH STREET, Ocala, FL 34476"
  },
  {
    address: "3535 SW 36TH AVE.",
    city: "Ocala",
    state: "FL",
    zip: "34474-4474",
    name: "LOWE'S OF OCALA, FL",
    number: "440",
    workroom: "Ocala",
    fullAddress: "3535 SW 36TH AVE., Ocala, FL 34474-4474"
  },
  {
    address: "4600 EAST SILVER SPRINGS BLVD",
    city: "Ocala",
    state: "FL",
    zip: "34470-3204",
    name: "LOWE'S OF E. OCALA, FL",
    number: "1855",
    workroom: "Ocala",
    fullAddress: "4600 EAST SILVER SPRINGS BLVD, Ocala, FL 34470-3204"
  },
  {
    address: "2564 NW 13TH STREET",
    city: "Gainesville",
    state: "FL",
    zip: "32609",
    name: "LOWE'S OF S.W. GAINESVILLE,FL",
    number: "3278",
    workroom: "Gainesville",
    fullAddress: "2564 NW 13TH STREET, Gainesville, FL 32609"
  },
  {
    address: "15910 NW 144 TERRACE",
    city: "Alachua",
    state: "FL",
    zip: "32615-9368",
    name: "LOWE'S OF ALACHUA, FL",
    number: "2984",
    workroom: "Gainesville",
    fullAddress: "15910 NW 144 TERRACE, Alachua, FL 32615-9368"
  },
  {
    address: "3463 NW BASCOM NORRIS DRIVE LAKE CITY FL 32055-4712",
    city: "Lake City",
    state: "FL",
    zip: "32055-4712",
    name: "LOWE'S OF LAKE CITY, FL",
    number: "179",
    workroom: "Gainesville",
    fullAddress: "3463 NW BASCOM NORRIS DRIVE LAKE CITY FL 32055-4712, Lake City, FL 32055-4712"
  },
  {
    address: "208 72ND TRCE NE",
    city: "Live Oak",
    state: "FL",
    zip: "32064-4842",
    name: "LOWE'S OF LIVE OAK, FL",
    number: "2462",
    workroom: "Gainesville",
    fullAddress: "208 72ND TRCE NE, Live Oak, FL 32064-4842"
  },
  {
    address: "2121 NE CAPITAL CIRCLE",
    city: "Tallahassee",
    state: "FL",
    zip: "32308-4303",
    name: "LOWE'S OF NE TALLAHASSEE, FL",
    number: "417",
    workroom: "Tallahassee",
    fullAddress: "2121 NE CAPITAL CIRCLE, Tallahassee, FL 32308-4303"
  },
  {
    address: "5500 COMMONWEALTH BLVD",
    city: "Tallahassee",
    state: "FL",
    zip: "32303-1323",
    name: "LOWE'S OF N.W. TALLAHASSEE, FL",
    number: "716",
    workroom: "Tallahassee",
    fullAddress: "5500 COMMONWEALTH BLVD, Tallahassee, FL 32303-1323"
  },
  {
    address: "13911 U.S. HIGHWAY 19 SOUTH",
    city: "Thomasville",
    state: "FL",
    zip: "31792-5395",
    name: "LOWE'S OF THOMASVILLE, GA",
    number: "1564",
    workroom: "Albany",
    fullAddress: "13911 U.S. HIGHWAY 19 SOUTH, Thomasville, FL 31792-5395"
  },
  {
    address: "1200 NORTH WESTOVER BLVD.",
    city: "Albany",
    state: "GA",
    zip: "31707-6601",
    name: "LOWE'S OF ALBANY, GA.",
    number: "492",
    workroom: "Albany",
    fullAddress: "1200 NORTH WESTOVER BLVD., Albany, GA 31707-6601"
  },
  {
    address: "602 VETERAN'S PARKWAY N",
    city: "Moultrie",
    state: "FL",
    zip: "31788-4122",
    name: "LOWE'S OF MOULTRIE, GA",
    number: "2621",
    workroom: "Albany",
    fullAddress: "602 VETERAN'S PARKWAY N, Moultrie, FL 31788-4122"
  },
  {
    address: "4860 MALLOY PLAZA",
    city: "Marianna",
    state: "FL",
    zip: "32448-2559",
    name: "LOWE'S OF MARIANNA, FL",
    number: "1924",
    workroom: "Panama City",
    fullAddress: "4860 MALLOY PLAZA, Marianna, FL 32448-2559"
  },
  {
    address: "300 EAST 23RD ST.",
    city: "Panama City",
    state: "FL",
    zip: "32405-4523",
    name: "LOWE'S OF PANAMA CITY, FL",
    number: "448",
    workroom: "Panama City",
    fullAddress: "300 EAST 23RD ST., Panama City, FL 32405-4523"
  },
  {
    address: "11751 PANAMA CITY BEACH PKWY",
    city: "Panama City Beach",
    state: "FL",
    zip: "32407-2507",
    name: "LOWE'S OF PANAMA CITY BEACH, FL",
    number: "2367",
    workroom: "Panama City",
    fullAddress: "11751 PANAMA CITY BEACH PKWY, Panama City Beach, FL 32407-2507"
  },
  {
    address: "2671 ROSS CLARK CIRCLE",
    city: "Dothan",
    state: "AL",
    zip: "36301-4905",
    name: "LOWE'S OF DOTHAN, AL",
    number: "606",
    workroom: "Dothan",
    fullAddress: "2671 ROSS CLARK CIRCLE, Dothan, AL 36301-4905"
  },
  {
    address: "7117 BROAD STREET",
    city: "Brooksville",
    state: "FL",
    zip: "34601-5536",
    name: "LOWE'S OF BROOKSVILLE, FL",
    number: "1827",
    workroom: "Ocala",
    fullAddress: "7117 BROAD STREET, Brooksville, FL 34601-5536"
  },
  {
    address: "9540 US HWY 441 LEESBURG FL",
    city: "Leesburg",
    state: "FL",
    zip: "34788-3948",
    name: "LOWE'S OF LAKE COUNTY, FL",
    number: "569",
    workroom: "Ocala",
    fullAddress: "9540 US HWY 441 LEESBURG FL, Leesburg, FL 34788-3948"
  },
  {
    address: "18795 US HIGHWAY 441",
    city: "Mt.Dora",
    state: "FL",
    zip: "32757-6741",
    name: "LOWE'S OF MT. DORA, FL",
    number: "2577",
    workroom: "Ocala",
    fullAddress: "18795 US HIGHWAY 441, Mt.Dora, FL 32757-6741"
  },
  {
    address: "5630 SEVEN MILE DRIVE",
    city: "Wildwood",
    state: "FL",
    zip: "34785",
    name: "LOWE'S OF WILDWOOD, FL",
    number: "3351",
    workroom: "Ocala",
    fullAddress: "5630 SEVEN MILE DRIVE, Wildwood, FL 34785"
  },
  {
    address: "4780 COMMERCIAL WAY",
    city: "Spring Hill",
    state: "FL",
    zip: "34606-1925",
    name: "LOWE'S OF SPRING HILL, FL",
    number: "1605",
    workroom: "Ocala",
    fullAddress: "4780 COMMERCIAL WAY, Spring Hill, FL 34606-1925"
  },
  {
    address: "13705 US HIGWAY 441",
    city: "LADY LAKE",
    state: "FL",
    zip: "32159-8981",
    name: "LOWE'S OF LADY LAKE, FL",
    number: "1685",
    workroom: "Ocala",
    fullAddress: "13705 US HIGWAY 441, LADY LAKE, FL 32159-8981"
  },
  {
    address: "2301 EAST GULF TO LAKE HWY",
    city: "Inverness",
    state: "FL",
    zip: "34453-3218",
    name: "LOWE'S OF INVERNESS, FL",
    number: "1853",
    workroom: "Ocala",
    fullAddress: "2301 EAST GULF TO LAKE HWY, Inverness, FL 34453-3218"
  },
  {
    address: "7575 SW 90TH STREET",
    city: "Ocala",
    state: "FL",
    zip: "34476",
    name: "LOWE'S OF S.W. MARION COUNTY, FL",
    number: "2753",
    workroom: "Ocala",
    fullAddress: "7575 SW 90TH STREET, Ocala, FL 34476"
  },
  {
    address: "3535 SW 36TH AVE.",
    city: "Ocala",
    state: "FL",
    zip: "34474-4474",
    name: "LOWE'S OF OCALA, FL",
    number: "440",
    workroom: "Ocala",
    fullAddress: "3535 SW 36TH AVE., Ocala, FL 34474-4474"
  },
  {
    address: "4600 EAST SILVER SPRINGS BLVD",
    city: "Ocala",
    state: "FL",
    zip: "34470-3204",
    name: "LOWE'S OF E. OCALA, FL",
    number: "1855",
    workroom: "Ocala",
    fullAddress: "4600 EAST SILVER SPRINGS BLVD, Ocala, FL 34470-3204"
  },
  {
    address: "2564 NW 13TH STREET",
    city: "Gainesville",
    state: "FL",
    zip: "32609",
    name: "LOWE'S OF S.W. GAINESVILLE,FL",
    number: "3278",
    workroom: "Gainesville",
    fullAddress: "2564 NW 13TH STREET, Gainesville, FL 32609"
  },
  {
    address: "15910 NW 144 TERRACE",
    city: "Alachua",
    state: "FL",
    zip: "32615-9368",
    name: "LOWE'S OF ALACHUA, FL",
    number: "2984",
    workroom: "Gainesville",
    fullAddress: "15910 NW 144 TERRACE, Alachua, FL 32615-9368"
  },
  {
    address: "3463 NW BASCOM NORRIS DRIVE LAKE CITY FL 32055-4712",
    city: "Lake City",
    state: "FL",
    zip: "32055-4712",
    name: "LOWE'S OF LAKE CITY, FL",
    number: "179",
    workroom: "Gainesville",
    fullAddress: "3463 NW BASCOM NORRIS DRIVE LAKE CITY FL 32055-4712, Lake City, FL 32055-4712"
  },
  {
    address: "208 72ND TRCE NE",
    city: "Live Oak",
    state: "FL",
    zip: "32064-4842",
    name: "LOWE'S OF LIVE OAK, FL",
    number: "2462",
    workroom: "Gainesville",
    fullAddress: "208 72ND TRCE NE, Live Oak, FL 32064-4842"
  },
  {
    address: "2121 NE CAPITAL CIRCLE",
    city: "Tallahassee",
    state: "FL",
    zip: "32308-4303",
    name: "LOWE'S OF NE TALLAHASSEE, FL",
    number: "417",
    workroom: "Tallahassee",
    fullAddress: "2121 NE CAPITAL CIRCLE, Tallahassee, FL 32308-4303"
  },
  {
    address: "5500 COMMONWEALTH BLVD",
    city: "Tallahassee",
    state: "FL",
    zip: "32303-1323",
    name: "LOWE'S OF N.W. TALLAHASSEE, FL",
    number: "716",
    workroom: "Tallahassee",
    fullAddress: "5500 COMMONWEALTH BLVD, Tallahassee, FL 32303-1323"
  },
  {
    address: "13911 U.S. HIGHWAY 19 SOUTH",
    city: "Thomasville",
    state: "FL",
    zip: "31792-5395",
    name: "LOWE'S OF THOMASVILLE, GA",
    number: "1564",
    workroom: "Albany",
    fullAddress: "13911 U.S. HIGHWAY 19 SOUTH, Thomasville, FL 31792-5395"
  },
  {
    address: "1200 NORTH WESTOVER BLVD.",
    city: "Albany",
    state: "GA",
    zip: "31707-6601",
    name: "LOWE'S OF ALBANY, GA.",
    number: "492",
    workroom: "Albany",
    fullAddress: "1200 NORTH WESTOVER BLVD., Albany, GA 31707-6601"
  },
  {
    address: "602 VETERAN'S PARKWAY N",
    city: "Moultrie",
    state: "FL",
    zip: "31788-4122",
    name: "LOWE'S OF MOULTRIE, GA",
    number: "2621",
    workroom: "Albany",
    fullAddress: "602 VETERAN'S PARKWAY N, Moultrie, FL 31788-4122"
  },
  {
    address: "4860 MALLOY PLAZA",
    city: "Marianna",
    state: "FL",
    zip: "32448-2559",
    name: "LOWE'S OF MARIANNA, FL",
    number: "1924",
    workroom: "Panama City",
    fullAddress: "4860 MALLOY PLAZA, Marianna, FL 32448-2559"
  },
  {
    address: "300 EAST 23RD ST.",
    city: "Panama City",
    state: "FL",
    zip: "32405-4523",
    name: "LOWE'S OF PANAMA CITY, FL",
    number: "448",
    workroom: "Panama City",
    fullAddress: "300 EAST 23RD ST., Panama City, FL 32405-4523"
  },
  {
    address: "11751 PANAMA CITY BEACH PKWY",
    city: "Panama City Beach",
    state: "FL",
    zip: "32407-2507",
    name: "LOWE'S OF PANAMA CITY BEACH, FL",
    number: "2367",
    workroom: "Panama City",
    fullAddress: "11751 PANAMA CITY BEACH PKWY, Panama City Beach, FL 32407-2507"
  },
  {
    address: "2671 ROSS CLARK CIRCLE",
    city: "Dothan",
    state: "AL",
    zip: "36301-4905",
    name: "LOWE'S OF DOTHAN, AL",
    number: "606",
    workroom: "Dothan",
    fullAddress: "2671 ROSS CLARK CIRCLE, Dothan, AL 36301-4905"
  },
]

// Helper to get stores by workroom
export function getStoresByWorkroom(workroomName: string): StoreLocation[] {
  const normalized = workroomName.trim()
  return storeLocations.filter(s => s.workroom.toLowerCase() === normalized.toLowerCase())
}
