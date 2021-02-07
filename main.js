'use strict';

console.log('hello csv');

const fileInput = document.getElementsByClassName('input-tag');
const masterInput = document.getElementById("master");
const chara = document.getElementById('chara');
let charaCode = 'utf-8';
const tooltip = new bootstrap.Tooltip(chara);

chara.addEventListener('click', () =>  tooltip.toggle());
chara.addEventListener('change', e => charaCode = e.target.value);

//csv読み込み処理
[...fileInput].forEach(input => {
  input.addEventListener("change", (e) => {
    const fileReader = new FileReader();
    const file = e.target.files[0];
    fileReader.readAsText(file, charaCode);
    fileReader.onload = (e) => {
      const result = e.target.result;
      // 店コード入力
      if (file.name.includes('店')) {
        const shopDict = new Map();
        result.split('\n').forEach(r => {
          const key = r.split(',')[0];
          const val = r.split(',')[1];
          shopDict.set(key, val);
        });
        const shopCode = JSON.stringify([...shopDict]);
        localStorage.setItem('shopcode', shopCode);
      }
      // お客様の声入力
      if (file.name.includes('お客様の声')) {
        const keyCnt = 9;  
        const valCnt = [8, 19];  
        const delIndex = [6, 7, 11, 12, 15, 19, 24, 26, 29];
        const dataList = formatMainData(result, keyCnt, valCnt, delIndex);
        createMailMessage(dataList);
      };
      // マスターフル入力
      if (file.name.includes('マスターフル')) {
        const { dataList: dataList, updated: updated } = formatMasterData(result);
        console.log(dataList);
        console.log(updated);
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
  
  let masterArry = [];
  valsArry.forEach(valArry => {
    const vals = valArry.split(',');
    const dict = new Map();
    vals.forEach((val, i) => {
      dict.set(keysArry[i], val);
    });
    masterArry.push(dict);
  });

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
      headeing.innerHTML = `${d.get('件')}件目
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-envelope-fill"
      viewBox="0 0 16 16">
      <path
        d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414.05 3.555zM0 4.697v7.104l5.803-3.558L0 4.697zM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.144l-6.57-4.027L8 9.586l-1.239-.757zm3.436-.586L16 11.801V4.697l-5.803 3.546z" />
      </svg>`;
      const copyBtn = document.createElement('button');
      copyBtn.setAttribute("id", `copy_${i}`);
      copyBtn.setAttribute('class', 'btn btn-outline-dark rounded-pill');
      // copyBtn.setAttribute('style', 'margin-left:5px;font-size:12px;');
      copyBtn.setAttribute('style', 'font-size:12px;position:absolute;top:60px;right:50px;');
      copyBtn.textContent = 'copy';
      const searchBtn = document.createElement('button');
      searchBtn.setAttribute('class', 'btn rounded-pill');
      searchBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-search" viewBox="0 0 16 16">
  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
</svg>`;
      const textArea = document.createElement('textarea');
      textArea.setAttribute("id", `mail_${i}`);
      textArea.setAttribute("class", `rounded bg-light`);
      textArea.setAttribute("cols", "50");
      textArea.setAttribute("rows", "15");
      const shopCode = getshopCodes().get(d.get("店舗Ｎｏ"));
      const contents = `${startMsg}\n\n【JAN】 ${d.get("ＪＡＮ")}\n【商品名】 ${d.get("商品名")}\n【容量】 ${d.get('容量')}\n【必要数】 ${d.get("必要本数")}本\n\n${shopCode}店より上記内容で問い合わせがございました。\n\n${lastMsg}`;
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
    localStorage.setItem('startMsg', sMsg);
    localStorage.setItem('lastMsg', lMsg);
    console.log(sMsg);
  });

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById("startMsg").value = localStorage.getItem("startMsg");
  document.getElementById("lastMsg").value = localStorage.getItem("lastMsg");
  const shopCode = getshopCodes();
  createShopCodeDOM(shopCode);
});

const getshopCodes = () => {
  const tmp = localStorage.getItem("shopcode");
   // JSのオブジェクト形式に戻す.
  const items = JSON.parse(tmp);
   // Mapを作成する.
  const shopCodeDict = new Map(items);
  return shopCodeDict;
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

