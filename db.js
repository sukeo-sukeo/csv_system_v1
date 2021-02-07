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