'use strict';

const dbName = "as_master";
const tableName = 'as';
const key = 'JAN1';

const createDB = () => {
  const dbRequest = indexedDB.open(dbName, 1);
  
  dbRequest.onupgradeneeded = (e) => {
    console.log("db upgrade dbname:" + dbName);
    const db = e.target.result;
    db.createObjectStore(tableName, { keyPath: key });
  };
  dbRequest.onsuccess = (e) => {
    console.log("db open success");
    const db = e.target.result;
    console.log(db);
    db.close();
  };
  dbRequest.onerror = (e) => {
    console.log("db open error");
  };
}

const insertDB_masterData = (dataList) => {
  const dbRequest = indexedDB.open(dbName);
  console.log(dataList);
  // return
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
  console.log(tage);
  const dbRequest = indexedDB.open(dbName);

  dbRequest.onsuccess = (e) => {
    console.log("db open success");
    const db = e.target.result;
    const trans = db.transaction(tableName, "readwrite");
    const store = trans.objectStore(tableName);
    const getreq = store.get(tage);

    getreq.onsuccess = (e) => {
      console.log(e.target.result);
      const result = e.target.result;
      console.log(result);
      if (!result) {
        dom.textContent = "該当なし";
      } else {
        dom.textContent = `${result['商品名'].trim()} 原価:${result['原価']} 売価:${result['基本売価']}(税込)`;
      }
    }

    db.close();
  };

  dbRequest.onerror = (e) => {
    console.log("db open error");
  };
}