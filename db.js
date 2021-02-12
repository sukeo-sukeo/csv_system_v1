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
    alert('master updated!');
    console.log(db);
    db.close();
  }

  dbRequest.onerror = (e) => {
    console.log('db open error');
  }

}

const searchDB = (tage, dom) => {
  if (!tage) return;
  const dbRequest = indexedDB.open(dbName);
  dbRequest.onsuccess = (e) => {
    console.log("db open success");
    const db = e.target.result;
    const trans = db.transaction(tableName, "readonly");
    const store = trans.objectStore(tableName);
    if (dom.id === 'result') {
      //searchボタンのとき
      console.log(!isNaN(tage));
      switch (true) {
        case !isNaN(tage):
          //数字のとき
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
        default:
          //   //文字のとき変数を検索してテーブルを作成
          //   // createMasterTable(getreq, dom);
          console.log('数字以外なので変数を検索するよ');
          console.log(tage);
          console.log(masterData);
          const limit = 10;
          let itemCodeList = [];
          for (let i = 0; i < masterData.length; i++) {
            if (itemCodeList.length === limit) break;
            if (masterData[i].商品名.includes(tage)) {
              console.log(masterData[i].コード + ': ' + masterData[i].商品名);
              itemCodeList.push(masterData[i].コード);
            }
          }
          console.log(itemCodeList);
          const index = store.index("codeIndex");
          itemCodeList.forEach(item => {
            const getreq = index.get(item);
            createMasterTable(getreq, dom);
          })
          break;
      }

      console.log('dbcolose');
      db.close();

      dbRequest.onerror = (e) => {
        console.log("db open error");
      };

    } else {
      //簡易検索ボタンのとき
      const getreq = store.get(tage);
      outputSearch(getreq, dom);

      db.close();
  
      dbRequest.onerror = (e) => {
        console.log("db open error");
      };
    }
  };
}

//簡易サーチ
const outputSearch = (getreq, dom) => {
   getreq.onsuccess = (e) => {
     const result = e.target.result;
     console.log(result);
     if (!result) {
       dom.textContent = "該当なし";
     } else {
       dom.textContent = `${result["商品名"].trim()} 原価:${
         result["原価"]
       } 売価:${result["基本売価"]}(税込)`;
     }
   };
}

//しっかりサーチ
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
  const makerName = getStorage("csvsystem_makercode").get(dict.get("メーカーコード"));
  dict.set('メーカーコード', `${makerName.trim()},${dict.get('メーカーコード')}`)
  dict.set('税率', getTaxString(dict.get('税率')));
  return dict;
}