'use strict';

console.log('hello csv');

const fileInput = document.getElementsByClassName('input-tag');
const masterInput = document.getElementById("master");
const chara = document.getElementById('chara');
let charaCode = localStorage.getItem("csvsystem_characode") || 'utf-8';
const tooltip = new bootstrap.Tooltip(chara);

chara.addEventListener('click', () =>  tooltip.toggle());
chara.addEventListener('change', e => {
  charaCode = e.target.value;
  localStorage.setItem("csvsystem_characode", charaCode);
}); 

//csv読み込み処理
[...fileInput].forEach(input => {
  input.addEventListener("change", (e) => {
    const fileReader = new FileReader();
    const file = e.target.files[0];
    fileReader.readAsText(file, charaCode);
    fileReader.onload = (e) => {
      const result = e.target.result;
      // お客様の声入力
      if (file.name.includes('お客様の声')) {
        const keyCnt = 9;  
        const valCnt = [8, 19];  
        const delIndex = [6, 7, 11, 12, 15, 19, 24, 26, 29];
        const dataList = formatMainData(result, keyCnt, valCnt, delIndex);
        console.log(dataList);
        createMailMessage(dataList);
        return;
      };
      // 店コード入力
      if (file.name.includes('店')) {
        const shopDict = new Map();
        result.split('\n').forEach(r => {
          const key = r.split(',')[0];
          const val = r.split(',')[1];
          shopDict.set(key, val);
        });
        const shopCode = JSON.stringify([...shopDict]);
        localStorage.setItem('csvsystem_shopcode', shopCode);
        createShopCodeDOM(shopCode);
        return;
      }
      // マスターフル入力
      if (file.name.includes('マスターフル')) {
        const { dataList: dataList, updated: updated } = formatMasterData(result);
        insertDB_masterData(dataList);
        return;
      }
    };
  });
}); 

const formatMasterData = (dataString) => {
  const dataArry = dataString.split("\n");
  const updated = dataArry[0].split(",")[1];
  const keysArry = dataArry[3].split(',');
  dataArry.splice(0, 4);
  const valsArry = dataArry;
  console.log(valsArry[0].split(',')[1]);
  console.log(typeof valsArry[0].split(',')[1]);
  let masterArry = [];
  valsArry.forEach(valArry => {
    const vals = valArry.split(',');
    const dict = new Map();
    vals.forEach((val, i) => {
      dict.set(keysArry[i], val);
    });
    masterArry.push(dict);
  });
  masterArry.pop();
  return {
    dataList: masterArry,
    updated: updated
  }
};

const formatMainData = (dataString, keyCnt, valCnt, delIndex) => {
  const dataArry = dataString.split("\n");
  const key_value = (dataArry) => {
    const k = dataArry
      .map((d, i) => {
        if (i < keyCnt) {
          return d.split(",");
        } else {
          return null;
        }
      })
      .filter((d) => d !== null);

    const v = dataArry
      .map((d, i) => {
        if (i > valCnt[0] && i < valCnt[1]) {
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
  const startMsg = document.getElementById("startMsg").value;
  const lastMsg = document.getElementById("lastMsg").value;
  const results = document.getElementById('results');
  initElements(results);
  dataList.forEach((d, i) => {
    if (d.get('商品名')) {
      const col = document.createElement('div')
      col.setAttribute('class', 'col-6 form-floating');
      col.setAttribute('style', 'text-align:center;');
      const headeing = document.createElement('a');
      headeing.setAttribute('class', 'badge bg-secondary outlined fs-3');
      headeing.setAttribute('style', 'margin-bottom: 5px;');
      headeing.innerHTML = `${d.get('件')}件目${icon_mail}`
      const copyBtn = document.createElement('button');
      copyBtn.setAttribute("id", `copy_${i}`);
      copyBtn.setAttribute('class', 'btn btn-outline-dark rounded-pill');
      copyBtn.setAttribute('style', 'font-size:12px;position:absolute;top:85px;right:50px;');
      copyBtn.textContent = 'copy';
      const searchBtn = document.createElement('button');
      searchBtn.setAttribute("class", `${d.get("ＪＡＮ")|| 'JAN不明'} btn rounded-pill`);
      searchBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="${
        d.get("ＪＡＮ") || "JAN不明"
      } bi bi-search" viewBox="0 0 16 16">
  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
</svg>`;
      const serachResult = document.createElement('p');
      serachResult.setAttribute('style', 'text-align:center;margin-bottom:0px;height:25px;font-size:12px;');
      searchBtn.addEventListener('click', e => searchDB(e.target.classList[0], serachResult)); 
      const textArea = document.createElement('textarea');
      textArea.setAttribute("id", `mail_${i}`);
      textArea.setAttribute("class", `rounded bg-light`);
      textArea.setAttribute("cols", "50");
      textArea.setAttribute("rows", "15");
      const shopCode = getshopCodes().get(d.get("店舗Ｎｏ"));
      const contents = `${startMsg}\n\n${d.get("ＪＡＮ") || 'JAN不明'} ${d.get("商品名")} ${d.get('容量')}\n上記商品を${d.get("必要本数")　|| ' ■'}本\n\n${shopCode || '■'}店より問い合わせがございました。\n\n${lastMsg}`;
      // const contents = `${startMsg}\n\n【JAN】 ${d.get("ＪＡＮ")}\n【商品名】 ${d.get("商品名")}\n【容量】 ${d.get('容量')}\n【必要数】 ${d.get("必要本数")}本\n\n${shopCode}店より上記内容で問い合わせがございました。\n\n${lastMsg}`;
      // const contents = `${startMsg}\n\nカテゴリ: ${d.get('カテゴリ')}\nJAN: ${d.get("ＪＡＮ")}\n商品名: ${d.get("商品名")}\n容量: ${d.get('容量')}\n必要数: ${d.get("必要本数")}本\n店舗名: ${shopCode}\n\n上記内容で問い合わせがございました。\n\n${lastMsg}`;
      textArea.textContent = contents;
      const adress = `sumple@test.com`
      const subject = `商品のお問い合わせ(${d.get('商品名')})`
      const mailto = `mailto:${adress}?subject=${subject}&amp;body=${contents}`
      headeing.setAttribute('href', mailto);
      results.appendChild(col).appendChild(textArea);
      col.insertBefore(headeing, textArea);
      col.insertBefore(copyBtn, textArea);
      col.insertBefore(searchBtn, textArea);
      col.insertBefore(serachResult, textArea);
     
      copyBtn.addEventListener('click', e => {
        textArea.select();
        document.execCommand('copy');
        copyBtn.textContent = 'copyed!'
        copyBtn.style.fontSize = '16px'
        copyBtn.classList.add('bg-success');
        copyBtn.classList.add('text-light');
      })
    }
  });
}

document.getElementById('changeMsg')
  .addEventListener('click', e => {
    const sMsg = document.getElementById('startMsg').value;
    const lMsg = document.getElementById('lastMsg').value;
    localStorage.setItem('csvsystem_startMsg', sMsg);
    localStorage.setItem('csvsystem_lastMsg', lMsg);
    console.log(sMsg);
  });

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById("startMsg").value = localStorage.getItem("csvsystem_startMsg");
  document.getElementById("lastMsg").value = localStorage.getItem("csvsystem_lastMsg");
  const shopCode = getshopCodes();
  createShopCodeDOM(shopCode);
  const { code1: code1, code2: code2 } = createCharaSelecter(localStorage.getItem("csvsystem_characode"));
  chara.appendChild(code1);
  chara.appendChild(code2);
  createDB();
});

const getshopCodes = () => {
  const tmp = localStorage.getItem("csvsystem_shopcode");
   // JSのオブジェクト形式に戻す.
  const items = JSON.parse(tmp);
   // Mapを作成する.
  const shopCodeDict = new Map(items);
  return shopCodeDict;
}


const createCharaSelecter = (storage) => {
  if (storage) {
    let code1 = document.createElement('option')
    code1.textContent = storage;
    code1.setAttribute("value", storage);
    let code2 = document.createElement('option');
    if (code1.textContent === 'shift-jis') {
      code2.textContent = 'utf-8';
      code2.setAttribute('value', 'utf-8');
    } else {
      code2.textContent = 'shfit-jis'
      code2.setAttribute('value', 'shift-jis');
    }
    return {
      code1: code1,
      code2: code2
    }
  } else {
    const code1 = document.createElement('option')
    code1.textContent = 'utf-8';
    code1.setAttribute("value", 'utf-8');
    const code2 = document.createElement('option')
    code2.textContent = 'shift-jis'
    code2.setAttribute("value", 'shift-jis');
    return {
      code1: code1,
      code2: code2
    }
  }
}

const createShopCodeDOM = (shopCodeDict) => {
  const tbody = document.getElementById("shopDataContainer");
  shopCodeDict.forEach((val, key) => {
    if (key === "店コード" || key === "" || key === "0") {
      return;
    }
    const tr = document.createElement("tr");
    const th = document.createElement("th");
    const td = document.createElement("td");
    th.appendChild(document.createTextNode(key));
    td.appendChild(document.createTextNode(val));
    th.setAttribute("scope", "row");
    tr.appendChild(th);
    tr.appendChild(td);
    tbody.appendChild(tr);
  });
}

const initElements = (...args) => {
  args.forEach((arg) => {
    while (arg.firstChild) {
      arg.removeChild(arg.firstChild);
    }
  });
};

