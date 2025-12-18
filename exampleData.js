const exampleData = {
  Number: 14999,
  Issued: Date.parse('2020-10-12') / 1000,
  Due: Date.parse('2020-11-12') / 1000,

  Invoicer: {
    Name: 'Chocolats de Luxe Mark Bachmann',
    Street1: 'Kronengasse 4',
    Street2: null,
    City: 'Aarau',
    State: '',
    Zip: '5000',
    Email: 'info@mark-bachmann.ch',
    Phone: '056 123 45 67',
    Website: 'www.mark-bachmann.ch',
  },

  Client: {
    Name: 'Monkeys Juggling',
    Street1: '100 Banana St',
    City: 'Bananaberg',
    State: 'NJ',
    Zip: '07048',
  },

  Items: [
    {
      Description: 'Wolf Whistle',
      Price: 35,
      Quantity: 3,
      Total: 105,
    },
    {
      Description: 'Bravo',
      Price: 30,
      Quantity: 17,
      Total: 510,
    },
  ],

  Subtotal: 615,
  Deduction: null,
  Taxes: null,
  Total: 615,
  Paid: true,
};
