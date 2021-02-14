'use strict';

console.log('hello csv');

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
        const delIndex = [0, 7, 8, 12, 13, 16, 20, 25, 27, 30];
        const dataList = formatMainData(result, keyCnt, valCnt, delIndex);
        console.log(dataList);
        createMailMessage(dataList);
        // document.getElementById("navbarSupportedContent").classList.add('show');
        return;
      };
      // マスターフル入力
      if (file.name.includes('マスターフル')) {
        const { dataList: dataList, updated: updated } = formatMasterData(result);
        localStorage.setItem('csvsystem_asupdated', updated);
        document.getElementById("updated").textContent = `更新日: ${updated}`;
        document.getElementById('csvinput').innerHTML = loader;
        insertDB_masterData(dataList);
        return;
      }
      // 店コード入力
      if (file.name.includes('店')) {
        const cols = [0, 1];
        const shopDict = postStorage("csvsystem_shopcode", result, cols);
        createShopCodeDOM(shopDict);
        return;
      }
      // メーカーコード入力
      if (file.name.includes('メーカー')) {
        const cols = [0, 1];
        postStorage("csvsystem_makercode", result, cols);
        return;
      }
      // 分類コード入力
      if (file.name.includes('中小分類')) {
        const cols = [2, 3];
        postStorage("csvsystem_categorycode", result, cols);
        return;
      }
    };
  });
}); 

const postStorage = (key, result, cols) => {
  console.log(key);
  const dict = new Map();
  result.split("\n").forEach((r) => {
    const key = r.split(",")[cols[0]];
    const val = r.split(",")[cols[1]];
    dict.set(key, val);
  });
  const dictToString = JSON.stringify([...dict]);
  localStorage.setItem(key, dictToString);
  return dict;
};

const formatMasterData = (dataString) => {
  const dataArry = dataString.split("\n");
  const updated = dataArry[0].split(",")[1];
  const keysArry = dataArry[3].split(',');
  dataArry.splice(0, 4);
  const valsArry = dataArry;
  let masterArry = [];
  valsArry.forEach(valArry => {
    const vals = valArry.split(',');
    const dict = new Map();
    vals.forEach((val, i) => {
      dict.set(keysArry[i], val.trim());
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
  dataArry.splice(0, 8);
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
          const splited_val = d.split(',');
          splited_val.shift();
          const shopCode = splited_val[1];
          if (shopCode.length !== 0 && shopCode.length !== 6) {
            const addStr = '00'
            splited_val[1] = shopCode[1] + addStr + shopCode.substr(1, 3);
          }
          return splited_val;
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
  dataList.forEach(async (d, i) => {
    if (d.get('商品名')) {
      const col = document.createElement('div')
      col.setAttribute('class', 'col-6 form-floating mail-container');
      col.setAttribute('style', 'text-align:center;');
      const headeing = document.createElement('a');
      headeing.setAttribute('class', 'badge bg-secondary outlined fs-3');
      headeing.setAttribute('style', 'margin-bottom: 5px;');
      headeing.innerHTML = `${d.get('件')}件目${icon_mail}`
      const copyBtn = document.createElement('button');
      copyBtn.setAttribute("id", `copy_${i}`);
      copyBtn.setAttribute('class', 'btn btn-outline-dark rounded-pill');
      copyBtn.setAttribute('style', 'font-size:12px;position:absolute;top:60px;right:50px;');
      copyBtn.textContent = 'copy';
      const searchBtn = document.createElement('button');
      // searchBtn.setAttribute("class", "miniSearchBtn");
      searchBtn.setAttribute('data-bs-toggle', 'collapse');
      searchBtn.setAttribute("data-bs-target", "#navbarSupportedContent");
      searchBtn.setAttribute("aria-controls", "navbarSupportedContent");
      searchBtn.setAttribute("aria-expanded", "false");
      searchBtn.setAttribute("aria-label", "Toggle navigation");
      searchBtn.setAttribute("class", `${d.get("ＪＡＮ") || 'JAN不明'} btn rounded-pill`);
      searchBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="${
        d.get("ＪＡＮ") || "JAN不明"
      } bi bi-search miniSearchBtn" viewBox="0 0 16 16">
  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
</svg>`;
      // const serachResult = document.createElement('table');
      // serachResult.setAttribute('class', 'table')
      // serachResult.setAttribute('style', 'text-align:center;margin-bottom:0px;height:25px;font-size:12px;'); 
      const textArea = document.createElement('textarea');
      textArea.setAttribute("id", `mail_${i}`);
      textArea.setAttribute("class", `rounded bg-light`);
      textArea.setAttribute("cols", "50");
      textArea.setAttribute("rows", "15");
      const shopCode = getStorage("csvsystem_shopcode").get(d.get("店舗Ｎｏ"));
      const contents = `${startMsg}\n\n${d.get("ＪＡＮ") || 'JAN不明'} ${d.get('"メーカー')} ${d.get("商品名")} ${d.get('容量')}\n上記商品を${d.get("必要本数")　|| ' ■'}本\n\n${shopCode || '■'}店より問い合わせがございました。\n\n${lastMsg}`;
      textArea.textContent = contents;
      const factoryMailto = async (contents) => {
        return await createMailto(d, contents).then((res) => res);
      }
      const mailto = await factoryMailto(contents);
      console.log(mailto);
      headeing.setAttribute('href', mailto);
      results.appendChild(col).appendChild(textArea);
      col.insertBefore(headeing, textArea);
      col.insertBefore(copyBtn, textArea);
      col.insertBefore(searchBtn, textArea);
      // col.insertBefore(serachResult, textArea);
      searchBtn.addEventListener("click", (e) => {
        const resultContainer = document.getElementById("result");
        initElements(resultContainer);
        searchDB(e.target.classList[0], resultContainer);
        
        document.getElementById('masterSearchbox').setAttribute("data-bs-toggle", "");
        searchBtn.setAttribute("data-bs-toggle", "");
      });
     
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

//文章の登録
document.getElementById('changeMsg')
  .addEventListener('click', e => {
    const sMsg = document.getElementById('startMsg').value;
    const lMsg = document.getElementById('lastMsg').value;
    localStorage.setItem('csvsystem_startMsg', sMsg);
    localStorage.setItem('csvsystem_lastMsg', lMsg);
  });

  //アドレスの登録
document.getElementById('saveAdress')
  .addEventListener('click', e => {
    const adressContainer = document.getElementById('adressContainer');
    const dict = new Map();
    [...adressContainer.childNodes].forEach(node => {
      if (node.tagName === 'INPUT') {
        dict.set(node.id.split('_')[1] ,node.value);
      }
    });
    const adress = JSON.stringify([...dict]);
    localStorage.setItem('csvsystem_adress', adress);
  });


document.addEventListener('DOMContentLoaded', () => {
  //マスター登録日の呼び出し
   document.getElementById(
     "updated"
   ).textContent = `更新日: ${localStorage.getItem("csvsystem_asupdated") || '未登録'}`;
  //文章の呼び出し
  document.getElementById("startMsg").value = localStorage.getItem("csvsystem_startMsg");
  document.getElementById("lastMsg").value = localStorage.getItem("csvsystem_lastMsg");
  //店コードの呼び出し
  const shopCode = getStorage("csvsystem_shopcode");
  if (shopCode) {
    createShopCodeDOM(shopCode);
  };
  //文字コードの呼び出し
  const { code1: code1, code2: code2 } = createCharaSelecter(localStorage.getItem("csvsystem_characode"));
  chara.appendChild(code1);
  chara.appendChild(code2);
  //アドレスの呼び出し
  const adress = getStorage("csvsystem_adress");
  const adressContainer = document.getElementById("adressContainer");
  adress.forEach((val, key) => {
    [...adressContainer.childNodes].forEach(node => {
      if (node.id) {
        if (key === node.id.split('_')[1]) {
          node.value = val;
        }
      }
    })
  })
  createDB();
});

const createMailto = async (d, contents) => {
  const adress = await getAdress(d.get("ＪＡＮ")).then((res) => res);
  console.log(adress);
  const subject = `商品のお問い合わせ(${d.get("商品名")})`;
  const mailto = `mailto:${adress}?subject=${subject}&body=${contents}`;
  return mailto;
}

//JANでマスター検索→帳合コードを取得→storageを取得して帳合コードと合致するadressを返却
const getAdress = async (jan) => {

  const promise = new Promise((resolve, reject) => {
    const dbRequest = indexedDB.open(dbName);

    dbRequest.onsuccess = (e) => {
      console.log("db open success");
      const db = e.target.result;
      const trans = db.transaction(tableName, "readonly");
      const store = trans.objectStore(tableName);
      const index = store.index("codeIndex");
      const item = createItemCodeList("JAN1", jan.trim());
      index.get(item[0]).onsuccess = (e) => {
        const data = e.target.result
        const adressDict = getStorage("csvsystem_adress");
        console.log(adressDict);
        const adress = adressDict.get('1140') || '';
        resolve(adress);
      }
    };
  });
  const adress = await promise;
  return adress;
}

const getStorage = (key) => {
  const tmp = localStorage.getItem(key);
   // JSのオブジェクト形式に戻す.
  const items = JSON.parse(tmp);
   // Mapを作成する.
  const dict = new Map(items);
  return dict;
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

// document.getElementById('')

// const createAdressDOM = () => {

// }

const initElements = (...args) => {
  args.forEach((arg) => {
    while (arg.firstChild) {
      arg.removeChild(arg.firstChild);
    }
  });
};


//検索結果コンテナーを閉じる処理
document.getElementById('masterContainerCloseBtn').addEventListener('click', e => {
  document.getElementById('navbarSupportedContent')
    .classList.remove('show');
  document
    .getElementById("masterSearchbox")
    .setAttribute("data-bs-toggle", "collapse");
})

//検索結果コンテナーを閉じないようにする処理
document.getElementById("masterSearchbox")
  .addEventListener('click', e => {
    const searchbox = e.target;
    // console.log(searchbox.getAttribute());
    searchbox.setAttribute("data-bs-toggle", '');
  });

//master検索の処理
document.getElementById('navSearchBtn')
  .addEventListener('click', e => {
    console.log(masterData);
    const resultContainer = document.getElementById("result");
    const word = document.getElementById("masterSearchbox").value;
    initElements(resultContainer);
    console.log(word);
    searchDB(word, resultContainer);
  })

  