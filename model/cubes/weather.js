cube(`weather`, {
  sql: `
    SELECT * FROM read_csv(
      'https://duckdb.org/data/flights.csv', 
      columns = {
        'FlightDate': 'DATE',
        'UniqueCarrier': 'VARCHAR',
        'OriginCityName': 'VARCHAR',
        'DestCityName': 'VARCHAR'
      })
  `,

  dimensions: {
    date: {
      sql: "FlightDate",
      type: "time",
    },
  },
});
