function ready(fn) {
  if (document.readyState !== 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

/**
 * Demo is only shown when the row has no Issued or Due date.
 */
function addDemo(row) {
  if (!('Issued' in row) && !('Due' in row)) {
    for (const key of ['Number', 'Issued', 'Due']) {
      if (!(key in row)) { row[key] = key; }
    }
    for (const key of ['Subtotal', 'Taxes', 'Total']) {
      if (!(key in row)) { row[key] = key; }
    }
    if (!('Note' in row)) { row.Note = '(Anything in a Note column goes here)'; }
  }
  if (!row.Invoicer) {
    row.Invoicer = {
      Name: 'Invoicer.Name',
      Street1: 'Invoicer.Street1',
      Street2: 'Invoicer.Street2',
      City: 'Invoicer.City',
      State: '.State',
      Zip: '.Zip',
      Email: 'Invoicer.Email',
      Phone: 'Invoicer.Phone',
      Website: 'Invoicer.Website',
      Konto: 'Invoicer.Konto',
      MWSTNr: 'Invoicer.MWSTNr',

    }
  }
  if (!row.Client) {
    row.Client = {
      Name: 'Client.Name',
      Street1: 'Client.Street1',
      Street2: 'Client.Street2',
      City: 'Client.City',
      State: '.State',
      Zip: '.Zip',
      Kundenref: 'Client.Kundenref',
    }
  }
  if (!row.Items) {
    row.Items = [
      {
        Description: 'Items[0].Description',
        Quantity: '.Quantity',
        Total: '.Total',
        Price: '.Price',
        VatRate: '.VatRate',
        Taxes: '.Taxes',
      },
      {
        Description: 'Items[1].Description',
        Quantity: '.Quantity',
        Total: '.Total',
        Price: '.Price',
        VatRate: '.VatRate',
        Taxes: '.Taxes',
      },
    ];
  }
  return row;
}

const data = {
  count: 0,
  invoice: {},
  tableConnected: false,
  rowConnected: false,
  haveRows: false,
};
let app = undefined;

function formatNumberAsCHF(value) {
  if (typeof value !== "number") {
    return value || '—';      // falsy value would be shown as a dash.
  }
  value = Math.round(value * 100) / 100;    // Round to nearest cent.
  value = (value === -0 ? 0 : value);       // Avoid negative zero.

  const result = value.toLocaleString('de-CH', {
    style: 'currency', currency: 'CHF'
  })
  if (result.includes('NaN')) {
    return value;
  }
  return result;
}

function fallback(value, str) {
  if (!value) {
    throw new Error("Please provide column " + str);
  }
  return value;
}

function asDate(value) {
  if (value === undefined || value === null || value === '') {
    return value || '—';
  }
  if (typeof(value) === 'number') {
    value = new Date(value * 1000);
  }
  const date = moment.utc(value)
  return date.isValid() ? date.format('DD.MM.YYYY') : value;
}

function tweakUrl(url) {
  if (!url) { return url; }
  if (url.toLowerCase().startsWith('http')) {
    return url;
  }
  return 'https://' + url;
};

function handleError(err) {
  console.error(err);
  const target = app || data;
  target.invoice = '';
  console.log(data);
}

function prepareList(lst, order) {
  if (order) {
    let orderedLst = [];
    const remaining = new Set(lst);
    for (const key of order) {
      if (remaining.has(key)) {
        remaining.delete(key);
        orderedLst.push(key);
      }
    }
    lst = [...orderedLst].concat([...remaining].sort());
  } else {
    lst = [...lst].sort();
  }
  return lst;
}

function updateInvoice(row) {
  try {
    if (row === null) {
      throw new Error("(No data - not on row - please add or select a row)");
    }
    console.log("GOT...", JSON.stringify(row));
    if (row.References) {
      try {
        Object.assign(row, row.References);
      } catch (err) {
        throw new Error('Could not understand References column. ' + err);
      }
    }

    // Add some guidance about columns.
    const want = new Set(Object.keys(addDemo({})));
    const accepted = new Set(['References']);
    const importance = ['Number', 'Client', 'Items', 'Total', 'Invoicer', 'Due', 
                        'Issued', 'Subtotal', 'Taxes', 'Note', 'Kundenref'];
    if (!('Due' in row || 'Issued' in row)) {
      const seen = new Set(Object.keys(row).filter(k => k !== 'id' && k !== '_error_'));
      const help = row.Help = {};
      help.seen = prepareList(seen);
      const missing = [...want].filter(k => !seen.has(k));
      const ignoring = [...seen].filter(k => !want.has(k) && !accepted.has(k));
      const recognized = [...seen].filter(k => want.has(k) || accepted.has(k));
      if (missing.length > 0) {
        help.expected = prepareList(missing, importance);
      }
      if (ignoring.length > 0) {
        help.ignored = prepareList(ignoring);
      }
      if (recognized.length > 0) {
        help.recognized = prepareList(recognized);
      }
      if (!seen.has('References') && !(row.Issued || row.Due)) {
        row.SuggestReferencesColumn = true;
      }
    }
    addDemo(row);
    if (!row.Subtotal && !row.Total && row.Items && Array.isArray(row.Items)) {
      try {
        row.Subtotal = row.Items.reduce((a, b) => a + b.Price * b.Quantity, 0);
        row.Total = row.Subtotal + (row.Taxes || 0);
      } catch (e) {
        console.error(e);
      }
    }
    if (row.Invoicer && row.Invoicer.Website && !row.Invoicer.Url) {
      row.Invoicer.Url = tweakUrl(row.Invoicer.Website);
    }

    // Remove keys from existing invoice object (Vue 3 no longer has Vue.delete).
    if (data.invoice && typeof data.invoice === 'object') {
      for (const key of want) {
        if (key in data.invoice) { delete data.invoice[key]; }
      }
      for (const key of ['Help', 'SuggestReferencesColumn', 'References']) {
        if (key in data.invoice) { delete data.invoice[key]; }
      }
    }
    data.invoice = Object.assign({}, data.invoice, row);

    // Make invoice information available for debugging.
    window.invoice = row;
  } catch (err) {
    handleError(err);
  }
}

ready(function() {
  // Update the invoice anytime the document data changes (if Grist is available).
  if (typeof grist !== 'undefined' && grist) {
    grist.ready();
    grist.onRecord(updateInvoice);
  } else {
    console.log('grist not found - running in local preview');
    // For local preview, show demo data so the invoice is visible. Only do this if
    // exampleData is available.
    if (typeof exampleData !== 'undefined') {
      try {
        updateInvoice(exampleData);
      } catch (e) {
        console.warn('Could not apply exampleData', e);
      }
    }
  }

  const vueApp = Vue.createApp({
    data() { return data; },
    methods: {
      currency: formatNumberAsCHF,
      fallback: fallback,
      asDate: asDate
    }
  });

  vueApp.config.errorHandler = function (err, vm, info) {
    handleError(err);
  };

  app = vueApp.mount('#app');

  if (document.location.search.includes('demo')) {
    updateInvoice(exampleData);
  }
  if (document.location.search.includes('labels')) {
    updateInvoice({});
  }
});
