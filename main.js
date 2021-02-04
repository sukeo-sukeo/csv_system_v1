'use strict';

console.log('hello csv');

const fileInput = document.getElementById('file');
const fileReader = new FileReader();

fileInput.addEventListener('change', e => {
  const file = e.target.files[0];
  console.log(file);
  fileReader.readAsText(file, 'shift-jis');
  fileReader.onload = (e) => {
    const result = e.target.result;
    const dataList = formatData(result);
    createMailMessage(dataList);
  }
});


const formatData = (dataString) => {
  const dataArry = dataString.split("\n");
  const key_value = (dataArry) => {
    const k = dataArry
      .map((d, i) => {
        if (i < 9) {
          return d.split(",");
        } else {
          return null;
        }
      })
      .filter((d) => d !== null);

    const v = dataArry
      .map((d, i) => {
        if (i > 8 && i < 19) {
          return d.split(",");
        } else {
          return null;
        }
      })
      .filter((d) => d !== null);

    let arry = [];
    k.forEach((s) => {
      arry.push(...s);
    });

    return {
      key: arry,
      value: v,
    };
  };

  const { key: key, value: value } = key_value(dataArry);

  const delIndex = [6, 7, 11, 12, 15, 19, 24, 26, 29];
  const keys = key.filter((_, i) => delIndex.indexOf(i) < 0);

  let dictList = [];
  value.forEach(vals => {
    const dict = new Map();
    vals.forEach((val, i) => {
      dict.set(keys[i], val);
    });
    dictList.push(dict);
  })

  return dictList;
}

const createMailMessage = (dataList) => {
  console.log(dataList);
  const startMsg = document.getElementById("startMsg").value;
  const lastMsg = document.getElementById("lastMsg").value;
  const d = dataList[0];
  const message = `${startMsg}\n\n${d.get("ＪＡＮ")} ${d.get("商品名")} ${d.get(
    "必要本数"
  )}本\n${d.get("店舗Ｎｏ")}店より問い合わせがございました。\n\n${lastMsg}`;
  ;
  document.getElementById('mail').textContent = message;
}

document.getElementById('sBtn')
  .addEventListener('click', e => {
    const sMsg = document.getElementById('startMsg').value;
    localStorage.setItem('startMsg', sMsg);
  });
document.getElementById('lBtn')
  .addEventListener('click', e => {
    const sMsg = document.getElementById('lastMsg').value;
    localStorage.setItem('lastMsg', sMsg);
  });


document.addEventListener('DOMContentLoaded', () => {
  document.getElementById("startMsg").value = localStorage.getItem("startMsg");
  document.getElementById("lastMsg").value = localStorage.getItem("lastMsg");
})