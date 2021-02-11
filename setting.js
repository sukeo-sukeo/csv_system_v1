'use strict';

//問い合わせメール作成時の表示項目
const needKeys = [
  "コード",
  "JAN1",
  "帳合",
  "原価",
  "基本売価",
  "TC/DC区分",
  "商品名",
  "部門",
  "容量",
  "入数", //発注単位
  "入数2", //箱入り数
  "メーカーコード",
  "度数",
  "扱区",
  "発注終了日",
];

//search時の表示項目
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
  "原価",
  "基本売価",
  "帳合",
  "分類",
  "扱区",
  "度数",
  "取扱開始日",
  "発注終了日",
];

//追加で表示させたいキー
const insertASkey = ['税率', '税抜', '値入率', '値入']

const tc_dc = {
  1: 'D',
  2: 'T'
}

const handling = {
  1: 'レジ✗/発注✗',
  2: 'レジ○/発注✗',
  3: 'レジ○/発注○'
}

//軽減税率適用部門 = tax_8
//税率がない部門 = tax_ather
const tax_8 = [20, 30, 40, 50, 60];
const tax_ather = [75];

const taxcalc = (category) => {
  if (tax_8.includes(category)) {
    return '8';
  } else {
    if (tax_ather.includes(category)) return '';
    return '10';
  }
}

const icon_search = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-search" viewBox="0 0 16 16">
  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
</svg>`;

const icon_mail = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-envelope-fill" viewBox="0 0 16 16">
  <path
    d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414.05 3.555zM0 4.697v7.104l5.803-3.558L0 4.697zM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.144l-6.57-4.027L8 9.586l-1.239-.757zm3.436-.586L16 11.801V4.697l-5.803 3.546z" />
  </svg>`;