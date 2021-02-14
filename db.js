'use strict';

const dbName = "as_master";
const tableName = 'as';
const key_jan = 'JAN1';
const index_code = 'コード';
let masterData;

const createDB = () => {
  const dbRequest = indexedDB.open(dbName, 1);
  
  dbRequest.onupgradeneeded = (e) => {
    console.log("db upgrade dbname:" + dbName);
    const db = e.target.result;
    const store = db.createObjectStore(tableName, { keyPath: key_jan });
    store.createIndex('codeIndex', index_code);
  };
  dbRequest.onsuccess = (e) => {
    console.log("db open success");
    const db = e.target.result;
    console.log(db);
    const trans = db.transaction(tableName, "readonly");
    const store = trans.objectStore(tableName);
    store.getAll().onsuccess = (e) => {
      masterData = null;
      masterData = e.target.result;
      // console.log(masterData);
    }
    db.close();
  };
  dbRequest.onerror = (e) => {
    console.log("db open error");
  };
}

const insertDB_masterData = (dataList) => {
  const dbRequest = indexedDB.open(dbName);

  dbRequest.onsuccess = (e) => {
    console.log("db open success");
    const db = e.target.result;
    const trans = db.transaction(tableName, 'readwrite');
    const store = trans.objectStore(tableName);
    dataList.forEach((data) => {
      const obj = Object.fromEntries(data);
      store.put(obj);
    });
    store.getAll().onsuccess = (e) => {
      masterData = null;
      masterData = e.target.result;
      // console.log(masterData);
    };
    alert('master updated!');
    document.getElementById("csvinput").innerHTML = defaultMessage;
    db.close();
  }

  dbRequest.onerror = (e) => {
    console.log('db open error');
  }

}

const searchDB = (tage, dom = null) => {
  if (!tage) return;
  const dbRequest = indexedDB.open(dbName);
  dbRequest.onsuccess = (e) => {
    console.log("db open success");
    const db = e.target.result;
    const trans = db.transaction(tableName, "readonly");
    const store = trans.objectStore(tableName);
    console.log(!isNaN(tage));
    switch (true) {
      //数字のとき
      case !isNaN(tage):
        if (tage.length === 7) {
          //７桁のときindex_codeをサーチ => index.get(tage)
          console.log("コード検索");
          const index = store.index("codeIndex");
          const getreq = index.get(tage);
          createMasterTable(getreq, dom);
        } else {
          //７桁じゃないときstoreをサーチ => sotre.get(tage)
          console.log("JAN検索");
          const getreq = store.get(tage);
          createMasterTable(getreq, dom);
        }
      break;
      //文字のとき変数を検索してテーブルを作成
      default:
        //引数で配列を検索し"コード"を返す
        const itemCodeList = createItemCodeList('商品名', tage);
        const index = store.index("codeIndex");
        itemCodeList.forEach(item => {
          const getreq = index.get(item);
          createMasterTable(getreq, dom);
        });
      break;
    }

    console.log('dbcolose');
    db.close();

    dbRequest.onerror = (e) => {
      console.log("db open error");
    };
  };
}

//マスターしっかりサーチ
const createMasterTable = (getreq, dom) => {
  getreq.onsuccess = (e) => {
    const asData = e.target.result;
    //項目を追加
    insertASkey.forEach(key => {
      asData[key] = '';
    });
    //項目に値を追加
    asData.税率 = taxcalc(asData.部門);
    asData.税抜売価 = Math.ceil(asData.基本売価 / asData.税率);
    // asData.値入率 = 1 - (asData.原価 / asData.税抜);
    asData.粗利額 = asData.税抜売価 - asData.原価;
    const resultDict = createResultDict(asData);
    console.log(resultDict);

    //項目作成
    const has_thead = document.getElementById('result').childElementCount;
    if (!has_thead) {
      const thead = document.createElement('thead');
      thead.setAttribute('class', 'thead-dark');
      const tr = document.createElement('tr');
      resultDict.forEach((_, key) => {
        const th = document.createElement('th');
        th.textContent = key;
        th.setAttribute('id', key);
        tr.appendChild(th);
      });
      dom.appendChild(thead).appendChild(tr);
    }

    //中身作成
    const tbody = document.createElement('tbody');
    const tr_d = document.createElement('tr');

    const makerColumnIndex = 4;
    let i = 0;
    resultDict.forEach((val, _) => {
      const td = document.createElement('td');
      if (i === makerColumnIndex) {
        td.textContent = val.split(',')[0];
        td.setAttribute('title', val.split(',')[1]);
      } else {
        td.textContent = val;
      }
      tr_d.appendChild(td);
      i++;
    });

    dom.appendChild(tbody).appendChild(tr_d);
    
  };
}

const createResultDict = (asData) => {
  const dict = new Map();
  needASkey.forEach((key) => {
    dict.set(key, asData[key]);
  });
  const getTaxString = (tax) => {
    if (tax === Number(1.1)) {
      return '10%';
    } else {
      return '8%';
    }
  }
  
  //TC/DC区分コードを'T'or'D'に付け替え
  dict.set("TC/DC区分", tc_dc[dict.get("TC/DC区分")]);
  //帳合コードを帳合名に付け替え
  dict.set('帳合', books[dict.get('帳合').trim()] || dict.get('帳合'));
  //分類コードを分類名に付け替え
  const categoryName = getStorage("csvsystem_categorycode").get(dict.get("分類"));
  dict.set('分類', categoryName.trim());
  //メーカーコードをメーカー名に付け替え
  const makerName = getStorage("csvsystem_makercode").get(dict.get("メーカーコード"));
  dict.set('メーカーコード', `${makerName.trim()},${dict.get('メーカーコード')}`)
  //税率(number)を税率(string)に付け替え
  dict.set('税率', getTaxString(dict.get('税率')));
  return dict;
}

const createItemCodeList = (key, tage) => {
  let itemCodeList = [];
  for (let i = 0; i < masterData.length; i++) {
    if (itemCodeList.length === limit) break;
    if (masterData[i][key].includes(tage)) {
      // console.log(masterData[i].コード + ": " + masterData[i][key]);
      itemCodeList.push(masterData[i].コード);
    }
  }
  return itemCodeList;
}