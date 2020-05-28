// extract address data from CSV file, for the indicated column

const fs = require('fs-extra');


// local paths
const originalsPath = './data/originals/';
const exportsPath = './data/exports';


// ////////////////////////////////////////////////////////////////////////////
// // METHODS

// /////////////////////////////////////////////////////////////////////
// load csv file
function readCSV(filePath, colDelimiter = ',', strDelimiter = '') {
  // if file is found in path
  if (fs.existsSync(filePath)) {
    // return parsed file
    const newArray = fs.readFileSync(filePath, 'utf8').split('\n');
    return newArray.filter(line => line).map(line => {
      if (strDelimiter !== '') {
        // if final column is missing, add empty value
        const newLine = line[line.length - 1] === colDelimiter ? `${line}""` : line;
        return newLine
            .split(`${strDelimiter}${colDelimiter}${strDelimiter}`)
            .map((item) => {
              let newItem = item.replace(/\s+/g, ' ');
              if (item[0] === strDelimiter) {
                newItem = newItem.slice(1);
              } else if (item[item.length - 1] === strDelimiter) {
                newItem = newItem.slice(0, -1);
              }
              // return new item
              return newItem;
            })
      } else {
        return line.split(colDelimiter);
      }
    });
  }
  // else return empty object
  console.log('\x1b[31m%s\x1b[0m',`ERROR: ${filePath} file NOT found!`);
  return [];
}

// /////////////////////////////////////////////////////////////////////
// remove romanian characters
function replaceROchars (inString) {
  return inString
      .toLowerCase()
      .replace(/ă/gi, 'a')
      .replace(/î/gi, 'i')
      .replace(/ş/gi, 's')
      .replace(/ș/gi, 's')
      .replace(/ţ/gi, 't')
      .replace(/ț/gi, 't')
      .replace(/â/gi, 'a')
      .replace('-', ' ')
      .toUpperCase();
};

// ////////////////////////////////////////////////////////////////////////////
// // MAIN function
function main() {

  // help text
  const helpText = `\n Available commands:\n\n\
  1. -h : display help text\n\
  2. -e : extract addresses data from the indicated file\n`;

  // get command line arguments
  const arguments = process.argv;
  console.log('\x1b[34m%s\x1b[0m', '\n@START: CLI arguments >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
  console.table(arguments);
  console.log('\n');

  // get third command line argument
  // if argument is missing, -h is set by default
  const mainArg = process.argv[2] || '-h';
  const secondaryArg = process.argv[3] || '';


  // run requested command
  // 1. if argument is 'h' or 'help' print available commands
  if (mainArg === '-h') {
    console.log(helpText);

  // 2. else if argument is 'e'
  } else if (mainArg === '-e') {
    // test input path
    if (fs.existsSync(secondaryArg)) {
      // create save file
      const saveFilePath = `${exportsPath}/${secondaryArg.replace(originalsPath, '')}`;
      const headerArr = ['id', 'denumire', 'cui', 'cod_inmatriculare', 'euid', 'stare_firma', 'judet', 'uat', 'localitate', 'adresa'];
      fs.writeFileSync(saveFilePath, `${headerArr.map(item => `"${item}"`).join(',')}\n`);

      // load file into array
      const dataArr = readCSV(secondaryArg, ',', '"');

      // for each item in array, without header
      dataArr.slice(1).forEach((row, index) => {
        // console.log(`\n${index}:: ${row[6]}`);
        // if address item is available
        if (row[6] !== '') {
          const addItem = row[6]
              .replace('"" Județ', ', Județ')
              // .replace(', ,', ',')
              .replace(', , Județ ', ', Județ ');

          // test for bucuresti
          const bucurestiRegex = /Bucureşti Sectorul (\d)(, (.+))?/g;
          const bucurestiMatch = bucurestiRegex.exec(addItem);

          // test for municipiu
          const municipiuRegex = /Municipiul ([^,]+)(, (.+))?, Județ ([^,]+)/g;
          const municipiuMatch = municipiuRegex.exec(addItem);

          // test for oras
          const orasRegex = /Oraş ([^,]+)(, (.+))?, Județ ([^,]+)/g;
          const orasMatch = orasRegex.exec(addItem);

          // test for loc + oras
          const locRegex = /Loc\. ([^,]+), Oraş ([^,]+)(, (.+))?, Județ ([^,]+)/g;
          const locMatch = locRegex.exec(addItem);

          // test for comuna
          const comunaRegex = /Comuna ([^,]+)(, (.+))?, Județ ([^,]+)/g;
          const comunaMatch = comunaRegex.exec(addItem);

          // test for sat + comuna
          const satRegex = /Sat ([^,]+), Comuna ([^,]+)(, (.+))?, Județ ([^,]+)/g;
          const satMatch = satRegex.exec(addItem);

          // test ***localitatea negasita***
          const noLocRegex = /\*\*\*localitatea negasita\*\*\*(, (.+))?, Județ ([^,]+)/g;
          const noLocMatch = noLocRegex.exec(addItem);

          // if bucuresti
          if (bucurestiMatch && bucurestiMatch.length > 0) {
            // console.log(bucurestiMatch);
            // prepare new array items
            const judet = 'MUNICIPIUL BUCURESTI';
            const uat = 'MUNICIPIUL BUCURESTI';
            const localitate = `SECTORUL ${bucurestiMatch[1]}`;
            const adresa = bucurestiMatch[3];
            // prepare new row
            const newRow = [row[0], row[1], row[2], row[3], row[4], row[5], judet, uat, localitate, adresa];
            // append save file
            fs.appendFileSync(saveFilePath, `${newRow.map(item => `"${item}"`).join(',')}\n`);

            // if municipiu
          } else if (municipiuMatch && municipiuMatch.length > 0) {
            // console.log(municipiuMatch);
            // prepare new array items
            const judet = replaceROchars(municipiuMatch[4]);
            const uat = replaceROchars(municipiuMatch[1]);
            const localitate = replaceROchars(municipiuMatch[1]);
            const adresa = municipiuMatch[3];
            // prepare new row
            const newRow = [row[0], row[1], row[2], row[3], row[4], row[5], judet, uat, localitate, adresa];
            // append save file
            fs.appendFileSync(saveFilePath, `${newRow.map(item => `"${item}"`).join(',')}\n`);

            // if oras
          } else if (orasMatch && orasMatch.length > 0) {
            // console.log(orasMatch);
            // prepare new array items
            const judet = replaceROchars(orasMatch[4]);
            const uat = replaceROchars(orasMatch[1]);
            const localitate = replaceROchars(orasMatch[1]);
            const adresa = orasMatch[3];
            // prepare new row
            const newRow = [row[0], row[1], row[2], row[3], row[4], row[5], judet, uat, localitate, adresa];
            // append save file
            fs.appendFileSync(saveFilePath, `${newRow.map(item => `"${item}"`).join(',')}\n`);

            // if loc + oras
          } else if (locMatch && locMatch.length > 0) {
            // console.log(locMatch);
            // prepare new array items
            const judet = replaceROchars(locMatch[5]);
            const uat = replaceROchars(locMatch[2]);
            const localitate = replaceROchars(locMatch[1]);
            const adresa = locMatch[4];
            // prepare new row
            const newRow = [row[0], row[1], row[2], row[3], row[4], row[5], judet, uat, localitate, adresa];
            // append save file
            fs.appendFileSync(saveFilePath, `${newRow.map(item => `"${item}"`).join(',')}\n`);

            // if comuna
          } else if (comunaMatch && comunaMatch.length > 0) {
            // console.log(comunaMatch);
            // prepare new array items
            const judet = replaceROchars(comunaMatch[4]);
            const uat = replaceROchars(comunaMatch[1]);
            const localitate = replaceROchars(comunaMatch[1]);
            const adresa = comunaMatch[3];
            // prepare new row
            const newRow = [row[0], row[1], row[2], row[3], row[4], row[5], judet, uat, localitate, adresa];
            // append save file
            fs.appendFileSync(saveFilePath, `${newRow.map(item => `"${item}"`).join(',')}\n`);

            // if sat + comuna
          } else if (satMatch && satMatch.length > 0) {
            // console.log(satMatch);
            // prepare new array items
            const judet = replaceROchars(satMatch[5]);
            const uat = replaceROchars(satMatch[2]);
            const localitate = replaceROchars(satMatch[1]);
            const adresa = satMatch[4];
            // prepare new row
            const newRow = [row[0], row[1], row[2], row[3], row[4], row[5], judet, uat, localitate, adresa];
            // append save file
            fs.appendFileSync(saveFilePath, `${newRow.map(item => `"${item}"`).join(',')}\n`);

            // if no locality is provided
          } else if (noLocMatch && noLocMatch.length > 0) {
            // console.log(satMatch);
            // prepare new array items
            const judet = replaceROchars(noLocMatch[3]);
            const uat = '';
            const localitate = '';
            const adresa = noLocMatch[2];
            // prepare new row
            const newRow = [row[0], row[1], row[2], row[3], row[4], row[5], judet, uat, localitate, adresa];
            // append save file
            fs.appendFileSync(saveFilePath, `${newRow.map(item => `"${item}"`).join(',')}\n`);

          } else {
            console.log(row);
          }
        }

      });


    } else {
      console.log('Provided PATH does not exist.');
    }


    // else print help
  } else {
    console.log(helpText);
  }

}


// ////////////////////////////////////////////////////////////////////////////
// // MAIN
main();
