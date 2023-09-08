function myFunction() {
  var spreadSheetAURL = "https://docs.google.com/spreadsheets/d/1JERvnyS74Y7zR-lAoeggdPu6nWFHT3VXp1Obrj5F8mI/edit"; 
  var sheetNameArray = [];

  var spreadSheetsInA = SpreadsheetApp.openByUrl(spreadSheetAURL).getSheets();
  var sheet = spreadSheetsInA[2];

  function DamerauLevenshtein(prices, damerau) {
  //'prices' customisation of the edit costs by passing an object with optional 'insert', 'remove', 'substitute', and
  //'transpose' keys, corresponding to either a constant number, or a function that returns the cost. The default cost
  //for each operation is 1. The price functions take relevant character(s) as arguments, should return numbers, and
  //have the following form:
  //
  //insert: function (inserted) { return NUMBER; }
  //
  //remove: function (removed) { return NUMBER; }
  //
  //substitute: function (from, to) { return NUMBER; }
  //
  //transpose: function (backward, forward) { return NUMBER; }
  //
  //The damerau flag allows us to turn off transposition and only do plain Levenshtein distance.

  if (damerau !== false) {
    damerau = true;
  }
  if (!prices) {
    prices = {};
  }
  let insert, remove, substitute, transpose;

  switch (typeof prices.insert) {
    case 'function':
      insert = prices.insert;
      break;
    case 'number':
      insert = function (c) {
        return prices.insert;
      };
      break;
    default:
      insert = function (c) {
        return 1;
      };
      break;
  }

  switch (typeof prices.remove) {
    case 'function':
      remove = prices.remove;
      break;
    case 'number':
      remove = function (c) {
        return prices.remove;
      };
      break;
    default:
      remove = function (c) {
        return 1;
      };
      break;
  }

  switch (typeof prices.substitute) {
    case 'function':
      substitute = prices.substitute;
      break;
    case 'number':
      substitute = function (from, to) {
        return prices.substitute;
      };
      break;
    default:
      substitute = function (from, to) {
        return 1;
      };
      break;
  }

  switch (typeof prices.transpose) {
    case 'function':
      transpose = prices.transpose;
      break;
    case 'number':
      transpose = function (backward, forward) {
        return prices.transpose;
      };
      break;
    default:
      transpose = function (backward, forward) {
        return 1;
      };
      break;
  }

  function distance(down, across) {
    //http://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance
    let ds = [];
    if (down === across) {
      return 0;
    } else {
      down = down.split('');
      down.unshift(null);
      across = across.split('');
      across.unshift(null);
      down.forEach(function (d, i) {
        if (!ds[i]) {
          ds[i] = [];
        }
        across.forEach(function (a, j) {
          if (i === 0 && j === 0) {
            ds[i][j] = 0;
          } else if (i === 0) {
            //Empty down (i == 0) -> across[1..j] by inserting
            ds[i][j] = ds[i][j - 1] + insert(a);
          } else if (j === 0) {
            //Down -> empty across (j == 0) by deleting
            ds[i][j] = ds[i - 1][j] + remove(d);
          } else {
            //Find the least costly operation that turns the prefix down[1..i] into the prefix across[1..j] using
            //already calculated costs for getting to shorter matches.
            ds[i][j] = Math.min(
              //Cost of editing down[1..i-1] to across[1..j] plus cost of deleting
              //down[i] to get to down[1..i-1].
              ds[i - 1][j] + remove(d),
              //Cost of editing down[1..i] to across[1..j-1] plus cost of inserting across[j] to get to across[1..j].
              ds[i][j - 1] + insert(a),
              //Cost of editing down[1..i-1] to across[1..j-1] plus cost of substituting down[i] (d) with across[j]
              //(a) to get to across[1..j].
              ds[i - 1][j - 1] + (d === a ? 0 : substitute(d, a))
            );
            //Can we match the last two letters of down with across by transposing them? Cost of getting from
            //down[i-2] to across[j-2] plus cost of moving down[i-1] forward and down[i] backward to match
            //across[j-1..j].
            if (damerau && i > 1 && j > 1 && down[i - 1] === a && d === across[j - 1]) {
              ds[i][j] = Math.min(ds[i][j], ds[i - 2][j - 2] + (d === a ? 0 : transpose(d, down[i - 1])));
            }
          }
        });
      });
      return ds[down.length - 1][across.length - 1];
    }
  }
  return distance;
}

var checker_list = sheet.getSheetValues(1, 3, 2000, 3);
for (i in checker_list) {
  checker_list[i] = checker_list[i][0].replace(/\s{2,}/g, ' ').trim().split(' ');
}
// console.log(checker_list[0][0]);
// console.log(checker_list[0]);
var all_students = sheet.getSheetValues(1, 1, 1000, 1);
for (i in all_students) {
  all_students[i] = all_students[i][0].replace(/\s{2,}/g, ' ').trim().split(' ');
}

// console.log(all_students[0][1]);
// console.log(all_students[0]);
// for (k in all_students[0]) {
//   console.log(k);
//   console.log(all_students[0][k].split(''));
// }

let dl = DamerauLevenshtein();
var ans = [];

for (i in all_students) {
  var min_value = 100;
  if (all_students[i] == '') {
    continue;
  }
  for (j in checker_list) {
    var check_up = 0;
    if (checker_list[j] == '') {
      continue;
    }

    var minimum = all_students[i];
    if (checker_list[j].length < minimum.length) {
      minimum = checker_list[j];
    }
    for (k in minimum) {
      var cnt = 0;
      // console.log(all_students[i]);
      // console.log(checker_list[j]);
      cnt = dl(all_students[i][k], checker_list[j][k]);
      check_up += cnt;
    }

    if (min_value > check_up) {
      min_value = check_up;
    }
    if (min_value == 0) {
      break;
    }
  }
  if (min_value <= 2) {
    ans.push(i);
  }
}

var range = SpreadsheetApp.getActive().getRange("автопроверка!B:B");
  range.insertCheckboxes("Y", "N");

for (i in ans) {
  sheet.getRange(Number(ans[i]) + 1, 2).check();
}

}
