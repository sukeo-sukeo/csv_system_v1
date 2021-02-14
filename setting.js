'use strict';

const fileInput = document.getElementsByClassName("input-tag");
const masterInput = document.getElementById("master");
const chara = document.getElementById("chara");
let charaCode = localStorage.getItem("csvsystem_characode") || "utf-8";

chara.addEventListener("change", (e) => {
  charaCode = e.target.value;
  localStorage.setItem("csvsystem_characode", charaCode);
}); 

//検索結果の表示件数
const limit = 100;

//search時の表示項目(この順番にデータが並びます)
const needASkey = [
  "コード",
  "JAN1",
  "部門",
  "TC/DC区分",
  "メーカーコード",
  "商品名",
  "容量",
  "入数2",
  "入数",
  "税率",
  "原価",
  "税抜売価",
  // "値入率",
  "基本売価",
  "粗利額",
  "帳合",
  "分類",
  "扱区",
  "度数",
  "取扱開始日",
  "発注終了日",
];

//ASにない項目(追加項目) ※needAskeyにもあわせて追加すること
const insertASkey = ['税率', '税抜売価', '粗利額']

const books = {
  1100: '卸部',
  1110: '秋田屋',
  1140: '三菱食品',
  1150: '国分',
  1160: 'イズミック',
  1170: '日本酒類販売',
  9900: '共通仕入先',
}

const tc_dc = {
  0: '-',
  1: 'T',
  2: 'D'
}

const handling = {
  1: 'レジ✗/発注✗',
  2: 'レジ○/発注✗',
  3: 'レジ○/発注○'
}

//軽減税率適用部門 = tax_8
const tax_8 = [20, 30, 40, 50, 60];
//税率がない部門 = tax_ather
const tax_ather = [75];
//部門によって税率を出し分ける処理
const taxcalc = (category) => {
  if (tax_8.includes(Number(category))) {
    return 1.08;
  } else {
    if (tax_ather.includes(Number(category))) return '';
    return 1.1;
  }
}

const loader = `<div class="spinner-border" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>`;

const defaultMessage = `please drag & drop <span>CSV!</span>`;

const icon_search = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-search" viewBox="0 0 16 16">
  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
</svg>`;

const icon_mail = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-envelope-fill" viewBox="0 0 16 16">
  <path
    d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414.05 3.555zM0 4.697v7.104l5.803-3.558L0 4.697zM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.144l-6.57-4.027L8 9.586l-1.239-.757zm3.436-.586L16 11.801V4.697l-5.803 3.546z" />
  </svg>`;