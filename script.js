const messages = document.querySelector("#messages");
const form = document.querySelector(".composer");
const input = document.querySelector("#messageInput");
const quickActions = document.querySelectorAll("[data-question]");

const floatImage = "float-icon.png";
const products = window.FLOAT_PRODUCTS || [];
const qaItems = window.FLOAT_QA || [];
let lastDiscussedProduct = null;
let waitingForCatalogProduct = false;
const FLOAT_TYPING_SPEED = 42;
const productLinks = [
  { label: "ペアマルチレイボーグ", href: "product-catalog.html?v=20260603-images#pairmulti-rayborg" },
  { label: "ペアマルチスーパー", href: "product-catalog.html?v=20260603-images#pairmulti-super" },
  { label: "スペーシア クール", href: "product-catalog.html?v=20260603-images#spacea-cool" },
  { label: "スペーシアクール", href: "product-catalog.html?v=20260603-images#spacea-cool" },
  { label: "ペアマルチEA", href: "product-catalog.html?v=20260603-images#pairmulti-ea" },
  { label: "フロート板ガラス", href: "product-catalog.html?v=20260603-images#float-glass" },
  { label: "フロートガラス", href: "product-catalog.html?v=20260603-images#float-glass" },
  { label: "透明ガラス", href: "product-catalog.html?v=20260603-images#float-glass" },
  { label: "網入りガラス", href: "product-catalog.html?v=20260603-images#wired-glass" },
  { label: "強化ガラス", href: "product-catalog.html?v=20260603-images#tempered-glass" },
  { label: "ペアマルチ", href: "product-catalog.html?v=20260603-images#pairmulti" },
  { label: "セキュオ", href: "product-catalog.html?v=20260603-images#secuo" },
  { label: "ラミペーン", href: "product-catalog.html?v=20260603-images#lamipane" },
  { label: "ソノグラス", href: "product-catalog.html?v=20260603-images#sonoglass" },
  { label: "スペーシア", href: "product-catalog.html?v=20260603-images#spacea" },
  { label: "型ガラス", href: "product-catalog.html?v=20260603-images#patterned-glass" },
  { label: "すりガラス", href: "product-catalog.html?v=20260603-images#frosted-glass" },
  { label: "摺ガラス", href: "product-catalog.html?v=20260603-images#frosted-glass" },
  { label: "スリガラス", href: "product-catalog.html?v=20260603-images#frosted-glass" },
];

const answers = [
  {
    keywords: ["資料", "フォルダ", "共有", "場所"],
    text: "資料なら、まず共有フォルダの「00_全社共有」と「10_部署別」を見るのが早いよ。探している資料名が分かれば、俺が候補を絞る。",
  },
  {
    keywords: ["議事録", "テンプレート", "会議"],
    text: "議事録テンプレートは、日時、参加者、決定事項、宿題、次回確認の順でまとめると使いやすい。必要ならこの場で下書きも作るよ。",
  },
  {
    keywords: ["休暇", "有給", "申請", "勤怠"],
    text: "休暇申請は勤怠システムから出せるよ。急ぎの休みなら、申請とあわせて上長にも一言入れておくと安心だ。",
  },
  {
    keywords: ["経費", "領収書", "精算"],
    text: "経費精算は月末締めが基本だよ。領収書の写真、用途、参加者、支払日をそろえておくと差し戻しになりにくい。",
  },
  {
    keywords: ["パスワード", "ログイン", "アカウント"],
    text: "ログインで困っているなら、まずパスワード再設定を試してみて。二段階認証で止まっている場合は、情報システムに端末名も添えて連絡しよう。",
  },
  {
    keywords: ["faq", "FAQ", "社内FAQ", "ルール"],
    text: "社内FAQなら、休暇、経費、勤怠、資料、アカウント周りをよく聞かれるよ。知りたい項目をそのまま俺に投げて。",
  },
];

function currentTime() {
  return new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

function createMessage({ author, text, own = false, float = false }) {
  const article = document.createElement("article");
  article.className = `message${own ? " own" : ""}${float ? " float-message" : ""}`;

  if (float) {
    const img = document.createElement("img");
    img.src = floatImage;
    img.alt = "フロート";
    article.append(img);
  } else if (!own) {
    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = author.slice(0, 1);
    article.append(avatar);
  }

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML = `
    <div class="message-meta">
      <strong></strong>
      <span>${currentTime()}</span>
    </div>
    <p></p>
  `;
  bubble.querySelector("strong").textContent = author;
  const paragraph = bubble.querySelector("p");
  paragraph.textContent = text;
  if (float) {
    applyProductLinks(paragraph);
  }
  article.append(bubble);
  messages.append(article);
  messages.scrollTop = messages.scrollHeight;
  return paragraph;
}

function createTypingMessage({ author, text }) {
  const textNode = createMessage({ author, text: "", float: true });
  let index = 0;

  function typeNextCharacter() {
    textNode.textContent = text.slice(0, index);
    messages.scrollTop = messages.scrollHeight;

    if (index <= text.length) {
      index += 1;
      const current = text[index - 1];
      const delay = current === "\n" ? FLOAT_TYPING_SPEED * 4 : FLOAT_TYPING_SPEED;
      window.setTimeout(typeNextCharacter, delay);
    } else {
      applyProductLinks(textNode);
    }
  }

  typeNextCharacter();
}

function applyProductLinks(element) {
  const text = element.textContent;
  const matchedLinks = productLinks
    .filter((link) => text.includes(link.label))
    .sort((a, b) => b.label.length - a.label.length);
  if (!matchedLinks.length) return;

  const pattern = new RegExp(`(${matchedLinks.map((link) => escapeRegExp(link.label)).join("|")})`, "g");
  const fragment = document.createDocumentFragment();
  let lastIndex = 0;

  text.replace(pattern, (match, _label, offset) => {
    if (offset > lastIndex) {
      fragment.append(document.createTextNode(text.slice(lastIndex, offset)));
    }

    const link = matchedLinks.find((item) => item.label === match);
    const anchor = document.createElement("a");
    anchor.href = link.href;
    anchor.target = "_blank";
    anchor.rel = "noopener";
    anchor.textContent = match;
    fragment.append(anchor);
    lastIndex = offset + match.length;
    return match;
  });

  if (lastIndex < text.length) {
    fragment.append(document.createTextNode(text.slice(lastIndex)));
  }

  element.replaceChildren(fragment);
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getFloatReply(question) {
  const normalized = question.toLowerCase();
  const thanksReply = getThanksReply(normalized);
  if (thanksReply) {
    return thanksReply;
  }

  if (waitingForCatalogProduct) {
    const catalogLink = findBestProductLinkMatch(normalized);
    if (catalogLink) {
      waitingForCatalogProduct = false;
      return addFollowUp(formatCatalogLinkReply(catalogLink));
    }
  }

  const productReply = getProductReply(normalized);
  if (productReply) {
    if (productReply === CATALOG_NEEDS_PRODUCT_REPLY) {
      return productReply;
    }
    return addFollowUp(productReply);
  }

  const match = answers.find((answer) =>
    answer.keywords.some((keyword) => normalized.includes(keyword.toLowerCase())),
  );

  if (match) {
    return addFollowUp(match.text);
  }

  return addFollowUp("ごめんね、その質問に対する答えはまだ学んでいないんだ。\n今はガラスの商品情報、使い分け、部屋ごとのおすすめ、登録済みQ&Aなら案内できるよ。");
}

function getThanksReply(normalizedQuestion) {
  const compact = normalizedQuestion.replace(/[!！?？。、\s]/g, "");
  const thanksWords = ["ありがとう", "ありがと", "助かった", "たすかった", "サンキュー", "thankyou", "thanks"];
  const isThanks = thanksWords.some((word) => compact.includes(word));
  const hasQuestionLikeText = ["教えて", "何", "なに", "どれ", "どっち", "違い", "おすすめ", "？", "?"].some((word) =>
    normalizedQuestion.includes(word),
  );

  if (!isThanks || hasQuestionLikeText) return "";

  return "どういたしまして。役に立てたならよかった。\nまたガラスのことで迷ったら、俺に聞いて。";
}

function addFollowUp(reply) {
  return `${reply}\n他には何か質問あるかな？`;
}

const CATALOG_NEEDS_PRODUCT_REPLY = "もちろんいいよ！どのガラスのカタログが見たいか教えてくれるかな？";

function formatCatalogLinkReply(link) {
  return [
    `もちろん。${link.label}のカタログ画像ページはこちらだよ。`,
    "下のリンクから見られるよ。",
    link.label,
    "スマホでもPDFをダウンロードせずに見られるようにしてある。",
  ].join("\n");
}

function getProductReply(normalizedQuestion) {
  const intent = getQuestionIntent(normalizedQuestion);

  const catalogLinkReply = getCatalogLinkReply(normalizedQuestion);
  if (catalogLinkReply) {
    return catalogLinkReply;
  }

  const shatteredGlassReply = getShatteredGlassReply(normalizedQuestion);
  if (shatteredGlassReply) {
    return shatteredGlassReply;
  }

  const appearanceGlassGuessReply = getAppearanceGlassGuessReply(normalizedQuestion);
  if (appearanceGlassGuessReply) {
    return appearanceGlassGuessReply;
  }

  const privacyGlassReply = getPrivacyGlassSpecificReply(normalizedQuestion, intent);
  if (privacyGlassReply) {
    return privacyGlassReply;
  }

  if (intent === "manufacturing") {
    const directMatch = findBestProductMatch(normalizedQuestion);
    if (directMatch) {
      lastDiscussedProduct = directMatch;
      return getManufacturingReply(directMatch, normalizedQuestion);
    }

    if (lastDiscussedProduct) {
      return getManufacturingReply(lastDiscussedProduct, normalizedQuestion);
    }
  }

  const wireTypeReply = getWireTypeReply(normalizedQuestion);
  if (wireTypeReply) {
    return wireTypeReply;
  }

  const roomReply = getRoomRecommendationReply(normalizedQuestion);
  if (roomReply) {
    return roomReply;
  }

  const comparisonReply = getComparisonReply(normalizedQuestion);
  if (comparisonReply) {
    return comparisonReply;
  }

  const quickTopicReply = getQuickTopicReply(normalizedQuestion);
  if (quickTopicReply) {
    return quickTopicReply;
  }

  const bestUseRecommendationReply = getBestUseRecommendationReply(normalizedQuestion);
  if (bestUseRecommendationReply) {
    return bestUseRecommendationReply;
  }

  const thermalRankingReply = getThermalRankingReply(normalizedQuestion);
  if (thermalRankingReply) {
    return thermalRankingReply;
  }

  const securityRecommendationReply = getSecurityRecommendationReply(normalizedQuestion);
  if (securityRecommendationReply) {
    return securityRecommendationReply;
  }

  const securitySuitabilityReply = getSecuritySuitabilityReply(normalizedQuestion);
  if (securitySuitabilityReply) {
    return securitySuitabilityReply;
  }

  const secuoGradeReply = getSecuoGradeReply(normalizedQuestion);
  if (secuoGradeReply) {
    return secuoGradeReply;
  }

  const securityGlassOverviewReply = getSecurityGlassOverviewReply(normalizedQuestion);
  if (securityGlassOverviewReply) {
    return securityGlassOverviewReply;
  }

  const directQaReply = getDirectSpecificQaReply(normalizedQuestion);
  if (directQaReply) {
    return directQaReply;
  }

  const directMatch = findBestProductMatch(normalizedQuestion);

  if (directMatch) {
    lastDiscussedProduct = directMatch;
    if (intent === "manufacturing") {
      return getManufacturingReply(directMatch, normalizedQuestion);
    }

    return withQaSupplement(
      intent ? formatProductIntentReply(directMatch, intent) : formatProductReply(directMatch),
      normalizedQuestion,
    );
  }

  if (intent && lastDiscussedProduct) {
    if (intent === "manufacturing") {
      return getManufacturingReply(lastDiscussedProduct, normalizedQuestion);
    }

    return withQaSupplement(formatProductIntentReply(lastDiscussedProduct, intent), normalizedQuestion);
  }

  const recommendation = getProductRecommendation(normalizedQuestion);
  if (recommendation.length > 0) {
    return [
      "その条件なら、まずこのあたりを見ればよさそうだよ。",
      recommendation.map((product) => `・${product.name}: ${getPlainBenefit(product)}`).join("\n"),
      "迷ったら、使う場所、困っていること、必要な性能を教えて。俺が候補を絞る。",
    ].join("\n");
  }

  if (["商品一覧", "覚えている商品", "登録商品", "何の商品"].some((word) => normalizedQuestion.includes(word))) {
    return [
      "今覚えている商品はこのあたりだよ。",
      products.map((product) => `・${product.name}（${product.category}）`).join("\n"),
      "商品名か、断熱・遮熱・防犯・防音・目隠しみたいな用途で聞いて。",
    ].join("\n");
  }

  return getQaReply(normalizedQuestion);
}

function getCatalogLinkReply(normalizedQuestion) {
  const asksCatalog =
    ["カタログ", "catalog", "画像", "ページ"].some((word) => normalizedQuestion.includes(word)) &&
    ["見せて", "見たい", "出して", "出す", "表示して", "開いて", "リンク", "どこ", "ページ", "画像"].some((word) => normalizedQuestion.includes(word));

  if (!asksCatalog) return "";

  const link = findBestProductLinkMatch(normalizedQuestion) || getLastDiscussedProductLink();
  if (!link) {
    waitingForCatalogProduct = true;
    return CATALOG_NEEDS_PRODUCT_REPLY;
  }

  waitingForCatalogProduct = false;
  return formatCatalogLinkReply(link);
}

function getShatteredGlassReply(normalizedQuestion) {
  const asksBrokenType =
    ["粉々", "こなごな", "粒状", "細かく", "バラバラ", "砕け", "割れていた", "割れた"].some((word) =>
      normalizedQuestion.includes(word),
    ) &&
    ["何ガラス", "なにガラス", "何のガラス", "なんのガラス", "どのガラス", "ガラス"].some((word) =>
      normalizedQuestion.includes(word),
    );

  if (!asksBrokenType) return "";

  return [
    "それは強化ガラスの可能性が高いよ。",
    "強化ガラスは強度を上げるために、あらかじめ強い力、圧縮応力を閉じ込めているんだ。",
    "何かの衝撃でヒビが入って表面の圧縮応力が壊れると、内部に蓄えられていた引張応力が一気に解放される。",
    "その結果、普通の板ガラスみたいな大きな破片ではなく、細かい粒状に割れることがあるよ。",
    "ガラスの右下に強化ガラスのマークがあるか確認してみて！",
  ].join("\n");
}

function getAppearanceGlassGuessReply(normalizedQuestion) {
  const hasAppearanceHint = [
    "ざらざら", "ザラザラ", "ざらつ", "白っぽ", "すり", "摺",
    "でこぼこ", "デコボコ", "凹凸", "ぼこぼこ", "模様", "型", "かすみ",
    "色が反射", "色付きで反射", "色つきで反射", "反射して見える", "反射する", "虹色", "青っぽ", "緑っぽ", "low-e", "lowe", "ローイー",
  ].some((word) => normalizedQuestion.includes(word.toLowerCase()));
  const asksGlassType =
    ["何ガラス", "なにガラス", "何のガラス", "なんのガラス", "何かわか", "何か分か", "どのガラス"].some((word) =>
      normalizedQuestion.includes(word.toLowerCase()),
    ) ||
    (hasAppearanceHint &&
      normalizedQuestion.includes("ガラス") &&
      ["ってなに", "って何", "とは", "なに", "何", "どんな", "どういう"].some((word) => normalizedQuestion.includes(word.toLowerCase()))) ||
    (["お客さん", "お客様", "客"].some((word) => normalizedQuestion.includes(word)) &&
      ["言われ", "言って", "聞かれ", "言う"].some((word) => normalizedQuestion.includes(word)) &&
      normalizedQuestion.includes("ガラス"));
  if (!asksGlassType) return "";

  if (["ざらざら", "ザラザラ", "ざらつ", "白っぽ", "すり", "摺"].some((word) => normalizedQuestion.includes(word.toLowerCase()))) {
    const product = products.find((item) => item.name === "すりガラス / 型ガラス");
    if (product) lastDiscussedProduct = product;
    return [
      "それはすりガラスの可能性が高いよ！",
      getFrostedGlassReply(""),
    ].join("\n");
  }

  if (["でこぼこ", "デコボコ", "凹凸", "ぼこぼこ", "模様", "型", "かすみ"].some((word) => normalizedQuestion.includes(word.toLowerCase()))) {
    const product = products.find((item) => item.name === "すりガラス / 型ガラス");
    if (product) lastDiscussedProduct = product;
    return [
      "それは型ガラスの可能性が高いよ！",
      getPatternedGlassReply(""),
    ].join("\n");
  }

  if (
    ["色が反射", "色付きで反射", "色つきで反射", "反射して見える", "反射する", "虹色", "青っぽ", "緑っぽ", "low-e", "lowe", "ローイー"].some((word) =>
      normalizedQuestion.includes(word.toLowerCase()),
    )
  ) {
    const product = products.find((item) => item.name === "ペアマルチLow-E" || item.name === "ペアマルチEA");
    if (product) lastDiscussedProduct = product;
    return [
      "それはLowE入りペアガラスの可能性が高いよ！",
      "LowE入りペアガラスは、2枚のガラスの間に空気層を持つ複層ガラスに、LowE膜という金属膜を組み合わせたガラスだよ。",
      "LowE膜は熱を反射しやすい膜で、断熱や遮熱に役立つんだ。",
      "見る角度や光の当たり方によって、うっすら色が反射して見えることがあるから、お客様が「色が反射して見える」と言っているならLowE入りの可能性を見てみるといいよ。",
      "刻印やスペーサーの表示、室内外どちら側に膜があるかも確認できると判断しやすいね。",
    ].join("\n");
  }

  return "";
}

function findBestProductLinkMatch(normalizedQuestion) {
  return productLinks
    .filter((link) => normalizedQuestion.includes(link.label.toLowerCase()))
    .sort((a, b) => b.label.length - a.label.length)[0] || null;
}

function getLastDiscussedProductLink() {
  if (!lastDiscussedProduct) return null;

  const preferredLabels = {
    "スペーシア": "スペーシア",
    "スペーシア クール": "スペーシア クール",
    "ペアマルチレイボーグ": "ペアマルチレイボーグ",
    "ペアマルチスーパー": "ペアマルチスーパー",
    "ペアマルチEA": "ペアマルチEA",
    "ペアマルチ": "ペアマルチ",
    "セキュオ / セキュオプラス": "セキュオ",
    "ラミペーン / カラーラミペーン": "ラミペーン",
    "ソノグラス": "ソノグラス",
    "テンパライト / ミストロンエース": "強化ガラス",
    "ヒシワイヤ / クロスワイヤ / プロテックス": "網入りガラス",
    "フロート板ガラス": "透明ガラス",
    "すりガラス / 型ガラス": "型ガラス",
  };

  const label = preferredLabels[lastDiscussedProduct.name];
  return productLinks.find((link) => link.label === label) || null;
}

function getWireTypeReply(normalizedQuestion) {
  const asksWireType =
    ["網入りガラス", "網入ガラス", "網入板ガラス", "網入り", "網入", "ワイヤー"].some((word) =>
      normalizedQuestion.includes(word),
    ) &&
    ["網の種類", "網種類", "ワイヤーの種類", "ワイヤー種類", "形", "形状", "種類"].some((word) =>
      normalizedQuestion.includes(word),
    );

  if (!asksWireType) return "";

  return [
    "網入りガラスの網の種類は、大きく見るとこの3つだよ。",
    "・ヒシワイヤ: 菱形の金網が入った網入板ガラス",
    "・クロスワイヤ: 井桁状、つまり格子状の金網が入った網入板ガラス",
    "・プロテックス: 縦線の金属線が入った線入板ガラス",
    "整理すると、ヒシワイヤとクロスワイヤは防火、プロテックスは飛散低減が主な目的だよ。",
  ].join("\n");
}

function getSecuritySuitabilityReply(normalizedQuestion) {
  const asksSecuritySuitability =
    ["防犯になる", "防犯になります", "防犯に使える", "防犯効果", "防犯性", "侵入対策になる"].some((word) =>
      normalizedQuestion.includes(word),
    ) ||
    (normalizedQuestion.includes("防犯") && ["なるの", "なりますか", "使えるの", "効果ある"].some((word) =>
      normalizedQuestion.includes(word),
    ));

  if (!asksSecuritySuitability) return "";

  const product = findBestProductMatch(normalizedQuestion);
  if (!product) {
    return [
      "防犯目的なら、まず防犯合わせガラスを見たいね。",
      "今の候補だと、セキュオ / セキュオプラスがいちばん近いよ。",
    ].join("\n");
  }

  lastDiscussedProduct = product;

  const replies = {
    "セキュオ / セキュオプラス": [
      "うん、セキュオは防犯目的に向いているガラスだよ。",
      "中間膜やポリカーボネート板で、こじ破りや打ち破りに抵抗して、侵入に時間をかけさせる考え方の商品なんだ。",
    ],
    "ヒシワイヤ / クロスワイヤ / プロテックス": [
      "網入りガラスは、防犯目的としてはおすすめしないよ。",
      "網が入っているから強そうに見えるけど、主な役割は防火や飛散低減。侵入対策ならセキュオみたいな防犯合わせガラスを見た方がいい。",
    ],
    "テンパライト / ミストロンエース": [
      "強化ガラスは、防犯目的としてはおすすめしないよ。",
      "強度は高いけど、一点に強い衝撃を受けると粒状に割れて開口しやすい。主な目的は、割れた時のけがを減らす安全性だね。",
    ],
    "フロート板ガラス": [
      "透明ガラス単体は、防犯目的としては弱いよ。",
      "見通しのよさが特徴の基本的な板ガラスだから、侵入対策を考えるならセキュオみたいな防犯合わせガラスを検討した方がいい。",
    ],
    "すりガラス / 型ガラス": [
      "型ガラスやすりガラスは、防犯目的のガラスではないよ。",
      "目隠しや採光が主な役割だから、侵入対策まで見たいならセキュオみたいな防犯合わせガラスを候補にしよう。",
    ],
    "ラミペーン / カラーラミペーン": [
      "ラミペーンは飛散防止や安全性を見たい合わせガラスで、防犯専用としてはセキュオの方が向いているよ。",
      "侵入対策が目的なら、防犯用の中間膜を使うセキュオを見た方が分かりやすい。",
    ],
    "ソノグラス": [
      "ソノグラスは防音を主目的にした合わせガラスだよ。",
      "防犯性も話題にはなるけど、侵入対策を主目的に選ぶならセキュオを優先して見た方がいい。",
    ],
  };

  const reply = replies[product.name];
  if (Array.isArray(reply)) return reply.join("\n");

  return reply || [
    `${product.name}は、防犯目的を主役にした商品ではないよ。`,
    "侵入対策を考えるなら、セキュオみたいな防犯合わせガラスを候補にしよう。",
  ].join("\n");
}

function getSecurityGlassOverviewReply(normalizedQuestion) {
  const asksSecurityGlass =
    normalizedQuestion.includes("防犯ガラス") &&
    !["違い", "比較", "どっち", "どちら", "30", "60", "90", "SP", "sp"].some((word) =>
      normalizedQuestion.includes(word),
    );

  if (!asksSecurityGlass) return "";

  const product = products.find((item) => item.name === "セキュオ / セキュオプラス");
  if (product) {
    lastDiscussedProduct = product;
  }

  return [
    "防犯ガラスは、セキュオ / セキュオプラスみたいに侵入対策を目的にした合わせガラスだよ。",
    "ガラスとガラスの間に防犯用の中間膜やポリカーボネート板を挟んで、割られても簡単に穴を開けにくくしている。",
    "戸建てや店舗の出入口、侵入が心配な窓、守りたい物があるショーケースまわりにおすすめ。",
    "お客様には「割られてもすぐに侵入しにくくして、ガラス破りに時間をかけさせる防犯ガラス」と説明するといいよ。",
  ].join("\n");
}

function withQaSupplement(baseReply, normalizedQuestion) {
  return baseReply;
}

function getQaSupplement(normalizedQuestion) {
  if (!qaItems.length) return "";
  if (!isSpecificQaQuestion(normalizedQuestion)) return "";

  const scored = qaItems
    .map((item) => ({ item, score: scoreQaItem(item, normalizedQuestion) }))
    .filter((entry) => entry.score >= 8)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) return "";
  return formatQaAnswer(scored[0].item);
}

function getDirectSpecificQaReply(normalizedQuestion) {
  if (!qaItems.length) return "";
  if (!isSpecificQaQuestion(normalizedQuestion)) return "";

  const scored = qaItems
    .map((item) => ({ item, score: scoreQaItem(item, normalizedQuestion) }))
    .filter((entry) => entry.score >= 12)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) return "";
  return formatQaAnswer(scored[0].item);
}

function getManufacturingQaAnswer(normalizedQuestion) {
  if (!qaItems.length) return "";

  const manufacturingWords = ["作ら", "作る", "作り方", "製造", "製法", "フロート法"];
  const scored = qaItems
    .filter((item) => {
      const searchable = normalizeSearchText(
        [item.question, item.answer, item.category, ...(item.keywords || [])].filter(Boolean).join(" "),
      );
      return manufacturingWords.some((word) => searchable.includes(word));
    })
    .map((item) => ({ item, score: scoreQaItem(item, normalizedQuestion) }))
    .filter((entry) => entry.score >= 8)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) return "";
  return formatQaAnswer(scored[0].item);
}

function isSpecificQaQuestion(normalizedQuestion) {
  return [
    "なぜ",
    "どう",
    "作ら",
    "作る",
    "違い",
    "ちがい",
    "違う",
    "どっち",
    "どちら",
    "熱割れ",
    "形状",
    "種類",
    "高い",
    "発注",
    "おすすめ",
    "防犯",
    "なりますか",
  ].some((word) => normalizedQuestion.includes(word));
}

function getQaReply(normalizedQuestion) {
  if (!qaItems.length) return "";

  const scored = qaItems
    .map((item) => ({ item, score: scoreQaItem(item, normalizedQuestion) }))
    .filter((entry) => entry.score >= 5)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) return "";

  const best = scored[0].item;
  return formatQaAnswer(best);
}

function scoreQaItem(item, normalizedQuestion) {
  const question = normalizeSearchText(item.question || "");
  const category = normalizeSearchText(item.category || "");
  const answer = normalizeSearchText(item.answer || "");
  const keywords = (item.keywords || []).map((word) => normalizeSearchText(word));
  const asked = normalizeSearchText(normalizedQuestion);
  let score = 0;

  for (const keyword of keywords) {
    if (keyword && asked.includes(keyword)) score += 4;
  }

  for (const token of tokenizeJapaneseLike(asked)) {
    if (token.length < 2) continue;
    if (question.includes(token)) score += 3;
    if (category.includes(token)) score += 2;
    if (answer.includes(token)) score += 1;
  }

  if (question && asked.includes(question)) score += 10;
  return score;
}

function normalizeSearchText(text) {
  return String(text)
    .toLowerCase()
    .replace(/[！？?、。・/／（）()「」『』【】［］\[\]\s]/g, "")
    .replace(/摺り/g, "すり")
    .replace(/摺/g, "すり")
    .replace(/スリ/g, "すり");
}

function tokenizeJapaneseLike(text) {
  return normalizeSearchText(text)
    .split(/と|は|が|の|に|を|で|へ|から|より|って|とは|です|ます|ください|教えて|なぜ|どう|どっち|どちら|おすすめ|使う|使える/)
    .filter(Boolean);
}

function formatQaAnswer(item) {
  return rewriteQaAnswerAsFloat(item.answer);
}

function rewriteQaAnswerAsFloat(answer) {
  const normalized = answer.replace(/\s+/g, " ").trim();

  if (normalized.includes("フロート法") && normalized.includes("スズ")) {
    return [
      "透明ガラスは、主にフロート法っていう方法で作られるよ。",
      "簡単に言うと、溶かしたガラスを溶けたスズの上に浮かべて、まっすぐ平らな板にする作り方なんだ。",
      "流れは、原料を高温で溶かす、スズの上に浮かべて平らにする、ゆっくり冷まして切る、という感じ。",
      "だから透明ガラスは、表面がなめらかで、ゆがみの少ない板ガラスになりやすいんだよ。",
    ].join("\n");
  }

  if (normalized.includes("お風呂場") && normalized.includes("型ガラス") && normalized.includes("すりガラス")) {
    return [
      "お風呂場なら、俺は型ガラスをおすすめするよ。",
      "理由は、すりガラスは濡れると透明に近くなって、中が透けやすくなることがあるから。",
      "型ガラスなら視線をさえぎりながら光を入れやすいし、掃除もしやすい。",
      "浴室や洗面まわりみたいに、目隠しと採光を両立したい場所には型ガラスが使いやすいね。",
    ].join("\n");
  }

  if (normalized.includes("網入りガラス") && normalized.includes("熱割れ")) {
    return [
      "網入りガラスが熱割れしやすいのは、中のワイヤーが熱を持ちやすいからだよ。",
      "直射日光などでガラスが高温になると、ワイヤーとガラスで膨張のしかたに差が出る。",
      "その差がガラスに負担をかけて、割れにつながることがあるんだ。",
      "あと、金網が入っているぶん、通常のガラスより強度面で不利になることもある。日当たりや熱がこもる場所では注意したいね。",
    ].join("\n");
  }

  if (normalized.includes("菱形ワイヤー") && normalized.includes("クロスワイヤー")) {
    return [
      "網入りガラスの網の形は、大きく3種類あるよ。",
      "菱形のワイヤー、井桁状のクロスワイヤー、縦線だけの線入りワイヤーだね。",
      "防火性を見るなら、菱形ワイヤーとクロスワイヤーが対象になる。",
      "線入りワイヤーは延焼を防ぐ目的には使えないから、防火ガラス扱いにはならない。ここは間違えやすいから注意だよ。",
    ].join("\n");
  }

  if (normalized.includes("透明の場合") && normalized.includes("磨く手間")) {
    return [
      "網入りガラスで透明の方が高いのは、製造時の手間が増えるからだよ。",
      "透明タイプは、網を入れたあとに磨く工程が必要になる。",
      "その分、型タイプより金額が高めになりやすいんだ。",
    ].join("\n");
  }

  if (normalized.includes("AGC") && normalized.includes("安価")) {
    return [
      "発注先がAGCになる理由は、価格面の都合だよ。",
      "このQ&Aでは、日本板硝子よりAGCの方が安価だから、と整理されている。",
      "見積や手配のときは、価格だけじゃなく納期や仕様も一緒に確認しよう。",
    ].join("\n");
  }

  if (normalized.includes("空き巣") && normalized.includes("防犯合わせガラス")) {
    return [
      "網入りガラスは、防犯目的のガラスとしてはおすすめしないよ。",
      "網が入っているから強そうに見えるけど、主な役割は防火や飛散低減なんだ。",
      "ガラス破り対策を考えるなら、防犯合わせガラス、たとえばセキュオみたいな商品を検討した方がいい。",
    ].join("\n");
  }

  if (normalized.includes("強化ガラス") && normalized.includes("防犯")) {
    return [
      "強化ガラスは、防犯目的としてはおすすめしないよ。",
      "強度は高いけど、先のとがったもので一点に衝撃を受けると、粒状に割れて大きく開口してしまうことがある。",
      "強化ガラスの主な目的は、割れた時のけがを減らす安全性。侵入対策なら、防犯合わせガラスを見た方がいいね。",
    ].join("\n");
  }

  if (normalized.includes("延焼") && normalized.includes("類火") && normalized.includes("金属網")) {
    return [
      "網入りガラスに網が入っている理由は、大きく言うと防火と飛散低減のためだよ。",
      "火災時にガラスが割れても、金網が破片を支えて穴が空きにくくする。延焼を抑えたり、避難時間を稼いだりする考え方だね。",
      "地震や衝撃で割れた時も、破片が大きく落ちたり飛び散ったりするのを減らす役割があるよ。",
    ].join("\n");
  }

  return normalized;
}

function getSecuoGradeReply(normalizedQuestion) {
  const asksSecuo = ["セキュオ", "secuo", "防犯ガラス"].some((word) =>
    normalizedQuestion.includes(word.toLowerCase()),
  );
  const mentionedGrades = getMentionedSecuoGrades(normalizedQuestion);
  const asksGradeComparison =
    hasComparisonIntent(normalizedQuestion) ||
    ["グレード", "種類", "ラインナップ"].some((word) => normalizedQuestion.includes(word)) ||
    mentionedGrades.length >= 2;

  if (!asksSecuo || !mentionedGrades.length && !asksGradeComparison) return "";

  const product = products.find((item) => item.name === "セキュオ / セキュオプラス");
  if (product) {
    lastDiscussedProduct = product;
  }

  if (mentionedGrades.length === 1 && !asksGradeComparison) {
    return getSingleSecuoGradeReply(mentionedGrades[0]);
  }

  return [
    "セキュオの30・60・90・SPの違いだね。ざっくり言うと、数字が大きいほど中間膜が厚くなって、打ち破りへの抵抗を高めたタイプになるよ。",
    "セキュオ30は、中間膜が約0.8ミリ。こじ破り対策を見たい住宅窓の基本候補。",
    "セキュオ60は、中間膜が約1.5ミリ。30より防犯性を上げたい戸建てやマンション向け。",
    "セキュオ90は、中間膜が約2.3ミリ。店舗やマンションなどで、より強い打ち破り対策を見たいときの候補。",
    "セキュオSPは、1.2ミリのポリカーボネート板を挟むタイプ。小型バールを使った打ち破り対策まで重視する場合に向いている。",
    "選び方としては、基本の防犯なら30、もう少し強めたいなら60、店舗や高リスク箇所なら90、さらに打ち破り対策を重視するならSP、という見方がしやすい。",
  ].join("\n");
}

function hasComparisonIntent(normalizedQuestion) {
  return ["違い", "ちがい", "違う", "異なる", "比較", "どっち", "どちら"].some((word) =>
    normalizedQuestion.includes(word),
  );
}

function getMentionedSecuoGrades(normalizedQuestion) {
  const grades = [];
  if (/(^|[^0-9])30([^0-9]|$)/.test(normalizedQuestion)) grades.push("30");
  if (/(^|[^0-9])60([^0-9]|$)/.test(normalizedQuestion)) grades.push("60");
  if (/(^|[^0-9])90([^0-9]|$)/.test(normalizedQuestion)) grades.push("90");
  if (normalizedQuestion.includes("sp")) grades.push("SP");
  return grades;
}

function getSingleSecuoGradeReply(grade) {
  const replies = {
    "30": [
      "セキュオ30についてだね。",
      "セキュオ30は、2枚のガラスの間に約0.8ミリ、つまり30milの中間膜を挟んだ防犯ガラスだよ。",
      "飛散防止を目的とする一般的な合わせガラスより中間膜が厚くて、ドライバーを使ったこじ破り対策を見たいときの基本候補になる。",
      "住宅の窓や、まず防犯性を上げたい場所で検討しやすいタイプだね。",
    ],
    "60": [
      "セキュオ60についてだね。",
      "セキュオ60は、約1.5ミリ、つまり60milの中間膜を挟んだ防犯ガラスだよ。",
      "30より中間膜が厚いから、こじ破りだけじゃなく小型バールを使った打ち破りへの抵抗も見たいときに候補になる。",
      "戸建て住宅やマンションで、防犯性をもう一段上げたい場所に向いている。",
    ],
    "90": [
      "セキュオ90についてだね。",
      "セキュオ90は、約2.3ミリ、つまり90milの中間膜を挟んだ防犯ガラスだよ。",
      "セキュオの数字タイプの中では中間膜が厚く、打ち破りへの抵抗をより重視したい場所で見やすい。",
      "店舗、マンション、守りたい物がある窓まわりなら候補に入りやすいね。",
    ],
    SP: [
      "セキュオSPについてだね。",
      "セキュオSPは、2枚のガラスの間に1.2ミリのポリカーボネート板と中間膜を挟んだタイプだよ。",
      "こじ破りだけでなく、小型バールを使った打ち破り対策まで重視する場合に向いている。",
      "戸建て住宅やマンションで、防犯対策をより強めたい場所に使いやすい候補だね。",
    ],
  };

  return replies[grade].join("\n");
}

function findBestProductMatch(normalizedQuestion) {
  const matches = products.flatMap((product) =>
    [product.name, ...product.aliases]
      .filter((word) => normalizedQuestion.includes(word.toLowerCase()))
      .map((word) => ({ product, score: word.length })),
  );

  matches.sort((a, b) => b.score - a.score);
  return matches[0]?.product || null;
}

function getRoomRecommendationReply(normalizedQuestion) {
  if (!["おすすめ", "お勧め", "向いて", "使う", "使える", "どのガラス", "何がいい"].some((word) => normalizedQuestion.includes(word))) {
    return "";
  }

  const rooms = [
    {
      words: ["お風呂", "風呂", "浴室", "バスルーム", "洗面", "脱衣"],
      productName: "すりガラス / 型ガラス",
      main: "型ガラス",
      reason: "視線をさえぎりながら光を入れやすいから、お風呂場や洗面まわりと相性がいい。",
      extra: "浴室は水がかかる場所だから、すりガラスより型ガラスを見た方が安心。型ガラスなら濡れても目隠し感を保ちやすいよ。",
    },
    {
      words: ["トイレ", "便所", "化粧室"],
      productName: "すりガラス / 型ガラス",
      main: "型ガラス",
      reason: "プライバシーを確保しながら採光できるから、小窓や建具に使いやすい。",
      extra: "外からの視線が強い場所なら、見え方をサンプルで確認しておくと安心だね。",
    },
    {
      words: ["玄関", "玄関ドア", "入口", "出入口", "勝手口"],
      productName: "セキュオ / セキュオプラス",
      main: "セキュオ",
      reason: "出入口まわりは侵入対策も見たい場所だから、防犯目的ならセキュオが候補になる。",
      extra: "目隠しや採光が主目的なら型ガラス、防犯が主目的ならセキュオ、という分け方がいい。",
    },
    {
      words: ["リビング", "居間", "LDK", "南向き", "西日"],
      productName: "スペーシア クール",
      main: "スペーシア クール",
      reason: "人が長く過ごす部屋は暑さ・寒さの影響が大きいから、断熱と遮熱を両方見やすい。",
      extra: "冬の寒さが主役ならスペーシア、夏の暑さや西日も気になるならスペーシア クールが見やすいよ。",
    },
    {
      words: ["寝室", "ベッドルーム", "子供部屋", "子ども部屋"],
      productName: "ソノグラス",
      main: "ソノグラス",
      reason: "眠る部屋は外の音が気になりやすいから、騒音対策をしたいならソノグラスが候補になる。",
      extra: "寒さや結露も困っているなら、断熱系のスペーシアやペアマルチスーパーも一緒に比較しよう。",
    },
    {
      words: ["キッチン", "台所"],
      productName: "ペアマルチ",
      main: "ペアマルチ",
      reason: "まずは基本の断熱と結露軽減を見やすい。外からの視線が気になる窓なら型ガラスも候補だね。",
      extra: "西日や暑さが強いキッチンなら、遮熱系のスペーシア クールやペアマルチレイボーグも見たい。",
    },
    {
      words: ["店舗", "店", "ショーケース", "陳列"],
      productName: "セキュオ / セキュオプラス",
      main: "セキュオ",
      reason: "店舗や陳列ケースは防犯性を見たいことが多いから、守りたい物があるならセキュオが候補になる。",
      extra: "見せることが主目的ならフロート板ガラス、防犯も必要ならセキュオ、という分け方がいい。",
    },
    {
      words: ["オフィス", "事務所", "会議室"],
      productName: "ソノグラス",
      main: "ソノグラス",
      reason: "会話や外部騒音が気になる場所なら、防音合わせガラスのソノグラスが候補になる。",
      extra: "外装窓で暑さ対策も必要なら、ペアマルチLow-Eも一緒に見るといい。",
    },
  ];

  const room = rooms.find((item) => item.words.some((word) => normalizedQuestion.includes(word.toLowerCase())));
  if (!room) return "";

  const product = products.find((item) => item.name === room.productName);
  if (product) {
    lastDiscussedProduct = product;
  }

  return [
    `${room.main}がおすすめだよ。`,
    room.reason,
    room.extra,
    "実際に決める前には、窓の場所、外からの視線、必要な性能、サイズを確認しよう。",
  ].join("\n");
}

function getComparisonReply(normalizedQuestion) {
  if (!hasComparisonIntent(normalizedQuestion)) {
    return "";
  }

  const mentionedProducts = findMentionedProducts(normalizedQuestion);
  if (mentionedProducts.length >= 2) {
    lastDiscussedProduct = mentionedProducts[0];
    return formatComparisonReply(mentionedProducts[0], mentionedProducts[1]);
  }

  const asksFrostedAndPatterned =
    ["すりガラス", "スリガラス", "摺ガラス", "すり板"].some((word) => normalizedQuestion.includes(word.toLowerCase())) &&
    ["型ガラス", "型板", "かすみ"].some((word) => normalizedQuestion.includes(word.toLowerCase()));

  if (asksFrostedAndPatterned) {
    const product = products.find((item) => item.name === "すりガラス / 型ガラス");
    if (product) {
      lastDiscussedProduct = product;
    }

    return [
      "すりガラスと型ガラスの違いだね。ざっくり言うと、どちらも目隠ししながら光を入れるガラスだけど、作り方と見え方が違うよ。",
      "すりガラスは、透明な板ガラスの片面を不透明に加工したもの。見え方はやわらかく、全体的に白っぽくぼかす感じ。落ち着いた目隠しに向いている。",
      "型ガラスは、ガラス表面に型模様をつけたもの。光を通しつつ、模様で視線をさえぎる。浴室、洗面所、玄関まわりみたいに、採光とプライバシーを両立したい場所で使いやすい。",
      "選び方としては、すっきり白くぼかしたいならすりガラス、柄の表情や実用的な目隠し感を出したいなら型ガラスを見るといい。",
    ].join("\n");
  }

  return "";
}

function getQuickTopicReply(normalizedQuestion) {
  const replies = [
    {
      words: ["断熱向け商品について教えて"],
      productName: "スペーシア",
      lines: [
        "断熱を考えているなら、スペーシアがおすすめだよ。",
        "スペーシアは二つガラスの間にある真空層と、LowE膜の力で、高い断熱性を持っているんだ。",
        "冬の寒さ、窓際の冷え、結露を抑えたい窓に向いている。",
        "スペーシアは薄型だから、単板サッシにも入るのがポイント。",
        "お客様が『サッシの交換を望んでいない時』や『窓ガラスの結露に悩んでいる』時、 ぜひスペーシアをすすめてみてね。",
        "",
        "あ、あと夏の日差しや暑さも一緒に抑えたいなら、高い遮熱性能を持つスペーシアクールも検討するといいよ。",
      ],
    },
    {
      words: ["防犯向け商品について教えて"],
      productName: "セキュオ / セキュオプラス",
      lines: [
        "防犯性を高めたいなら、セキュオがおすすめだよ。",
        "セキュオはバールなどで割られても穴を開けにくい合わせガラスなんだ。",
        "セキュオ30、60、90、SPは数字が大きいほど中間膜が厚くなって、打ち破りへの抵抗がより強くなる。",
        "より高い防犯性を求めているなら、ガラスとガラスの間にポリカが入っているSPが一番おすすめかな。SPは単板サッシにも入るから安心だよ♪",
        "CPマークの付いている高強度の面格子と組み合わせると、さらに窓の防犯性アップ！ ぜひお客様にもすすめてみてね♡",
      ],
    },
    {
      words: ["防音向け商品について教えて"],
      productName: "ソノグラス",
      lines: [
        "防音向け商品ならソノグラスがおすすめだよ。",
        "防音特殊中間膜を使った合わせガラスのソノグラスは、外部の騒音はもちろん、家の中の音も外に伝えにくくなる。",
        "道路、鉄道、空港、工場の近くや、室内の音漏れを抑えたい場所に向いているんだ。",
        "内窓と組み合わせると、さらに高い防音効果を期待できるよ。",
      ],
    },
  ];

  const reply = replies.find((item) =>
    item.words.some((word) => normalizedQuestion.includes(word.toLowerCase())),
  );

  if (!reply) return "";

  const product = products.find((item) => item.name === reply.productName);
  if (product) {
    lastDiscussedProduct = product;
  }

  return reply.lines.join("\n");
}

function getBestUseRecommendationReply(normalizedQuestion) {
  const asksBestUse =
    ["一番", "最も", "もっとも", "最高", "高い", "強い", "向いて", "おすすめ", "お勧め", "どのガラス", "何がいい", "どれがいい", "使える", "商品"].some((word) =>
      normalizedQuestion.includes(word),
    );

  if (!asksBestUse) return "";

  const recommendations = [
    {
      words: ["断熱", "寒さ", "結露", "熱貫流", "暖房"],
      productName: "スペーシア",
      lines: [
        "スペーシアだよ。",
        "断熱性をいちばん重視するなら、真空層を使った高断熱ガラスのスペーシアが分かりやすい。",
        "冬の寒さ、窓際の冷え、結露を抑えたい窓に向いている。",
        "ただし、夏の日差しや暑さも一緒に抑えたいなら、スペーシア クールも比較するといいよ。",
      ],
    },
    {
      words: ["遮熱", "暑さ", "暑い", "西日", "日射", "紫外線", "uv"],
      productName: "ペアマルチレイボーグ",
      lines: [
        "遮熱を重視するなら、ペアマルチレイボーグだよ。",
        "夏の日射熱や紫外線を抑えたい住宅向けのLow-E複層ガラスとして見やすい。",
        "西日が強い部屋、夏に室温が上がりやすい窓、家具やカーテンの日焼けを抑えたい場所に向いている。",
        "既存サッシを活かしたい相談なら、スペーシア クールも一緒に比較するといいよ。",
      ],
    },
    {
      words: ["防犯", "侵入", "こじ破り", "打ち破り", "ガラス破り"],
      productName: "セキュオ / セキュオプラス",
      lines: [
        "セキュオだよ。",
        "防犯性を高めたいなら、割られても穴を開けにくい防犯合わせガラスを見たい。",
        "セキュオ30、60、90、SPは数字が大きいほど中間膜が厚くなって、打ち破りへの抵抗をより見やすくなるよ。",
        "高い防犯性を求めているなら、ガラスとガラスの間にポリカが入っているSPがおすすめ。",
        "戸建ての窓、玄関まわり、店舗、守りたい物があるショーケースまわりに向いている。",
        "お客様には「ガラス破りに時間をかけさせる防犯ガラス」と説明するといいよ。",
      ],
    },
    {
      words: ["防音", "遮音", "騒音", "音"],
      productName: "ソノグラス",
      lines: [
        "ソノグラスだよ。",
        "音を抑えたいなら、防音特殊中間膜を使った合わせガラスのソノグラスが分かりやすい。",
        "道路、鉄道、空港、工場の近くや、室内の音漏れを抑えたい場所に向いている。",
        "寒さや結露も同時に困っているなら、断熱系のガラスも一緒に比較しよう。",
      ],
    },
    {
      words: ["目隠し", "プライバシー", "浴室", "風呂", "お風呂", "トイレ", "洗面"],
      productName: "すりガラス / 型ガラス",
      lines: [
        "型ガラスだよ。",
        "目隠ししながら光を入れたい場所なら、表面の模様で視線をぼかせる型ガラスが使いやすい。",
        "浴室、洗面所、トイレ、玄関まわりに向いている。",
        "浴室は水がかかる場所だから、すりガラスより型ガラスを見た方が安心だよ。",
      ],
    },
    {
      words: ["強度", "割れにくい", "安全", "耐風圧"],
      productName: "テンパライト / ミストロンエース",
      lines: [
        "強度を重視するなら、テンパライトだよ。",
        "通常の板ガラスより強度を高めた強化ガラスで、割れた時に粒状になりやすいのが特徴。",
        "安全設計が必要な開口部、店舗、オフィス、学校、公共施設などに向いている。",
        "ただし防犯目的なら、強化ガラスではなくセキュオを見た方がいいよ。",
      ],
    },
    {
      words: ["防火", "延焼", "網入り", "網入"],
      productName: "ヒシワイヤ / クロスワイヤ / プロテックス",
      lines: [
        "防火を見たいなら、ヒシワイヤやクロスワイヤだよ。",
        "金網入りのガラスで、延焼のおそれのある開口部などに使われる。",
        "トップライトや防煙垂れ壁など、飛散低減も見たい場所ではプロテックスも候補になる。",
        "防犯用ではないから、侵入対策ならセキュオと分けて考えよう。",
      ],
    },
    {
      words: ["透明", "見通し", "ショーケース", "ディスプレイ"],
      productName: "フロート板ガラス",
      lines: [
        "透明に見せたいなら、フロート板ガラスだよ。",
        "ゆがみが少なく、見通しのよい基本の板ガラスとして使いやすい。",
        "窓、ショーケース、ディスプレイ、家具、額縁などに向いている。",
        "断熱・防犯・防音みたいな性能が必要なら、用途に合わせて機能ガラスを選ぼう。",
      ],
    },
  ];

  const recommendation = recommendations.find((item) =>
    item.words.some((word) => normalizedQuestion.includes(word)),
  );

  if (!recommendation) return "";

  const product = products.find((item) => item.name === recommendation.productName);
  if (product) {
    lastDiscussedProduct = product;
  }

  return recommendation.lines.join("\n");
}

function getThermalRankingReply(normalizedQuestion) {
  const asksThermal =
    ["断熱", "寒さ", "結露", "熱貫流", "暖房"].some((word) => normalizedQuestion.includes(word));
  const asksRanking =
    ["一番", "最も", "もっとも", "最高", "高い", "強い", "どれがいい"].some((word) =>
      normalizedQuestion.includes(word),
    );

  if (!asksThermal || !asksRanking) return "";

  const product = products.find((item) => item.name === "スペーシア");
  if (product) {
    lastDiscussedProduct = product;
  }

  return [
    "スペーシアだよ。",
    "断熱性をいちばん重視するなら、まずスペーシアを見るのが分かりやすい。",
    "スペーシアは真空層を使った高断熱ガラスで、カタログではフロート板ガラスの約4倍、一般複層ガラスの約2倍の断熱性能と説明されている。",
    "冬の寒さ、窓際の冷え、結露を抑えたい相談なら候補にしやすい。",
    "ただし、夏の日差しや暑さも一緒に抑えたいなら、スペーシア クールも比較するといいよ。",
  ].join("\n");
}

function getPrivacyGlassSpecificReply(normalizedQuestion, intent) {
  const asksFrosted = ["すりガラス", "スリガラス", "摺ガラス", "摺りガラス", "すり板"].some((word) =>
    normalizedQuestion.includes(word.toLowerCase()),
  );
  const asksPatterned = ["型ガラス", "型板", "かすみ"].some((word) =>
    normalizedQuestion.includes(word.toLowerCase()),
  );

  if ((asksFrosted && asksPatterned) || (!asksFrosted && !asksPatterned)) {
    return "";
  }

  const product = products.find((item) => item.name === "すりガラス / 型ガラス");
  if (product) {
    lastDiscussedProduct = product;
  }

  if (asksPatterned) {
    return getPatternedGlassReply(intent);
  }

  return getFrostedGlassReply(intent);
}

function getSecurityRecommendationReply(normalizedQuestion) {
  const asksSecurity =
    ["防犯", "侵入", "こじ破り", "打ち破り", "ガラス破り"].some((word) =>
      normalizedQuestion.includes(word),
    );
  const asksRecommendation =
    ["おすすめ", "お勧め", "どのガラス", "何がいい", "向いて", "高めるなら", "上げるなら", "使える", "商品"].some((word) =>
      normalizedQuestion.includes(word),
    );

  if (!asksSecurity || !asksRecommendation) return "";

  const product = products.find((item) => item.name === "セキュオ / セキュオプラス");
  if (product) {
    lastDiscussedProduct = product;
  }

  return [
    "セキュオだよ。",
    "防犯性を高めたいなら、割られても穴を開けにくい防犯合わせガラスを見たい。",
    "セキュオ30、60、90、SPは数字が大きいほど中間膜が厚くなって、打ち破りへの抵抗をより見やすくなるよ。",
    "高い防犯性を求めているなら、ガラスとガラスの間にポリカが入っているSPがおすすめ。",
    "戸建ての窓、玄関まわり、店舗、守りたい物があるショーケースまわりに向いている。",
    "お客様には「ガラス破りに時間をかけさせる防犯ガラス」と説明するといいよ。",
  ].join("\n");
}

function getPatternedGlassReply(intent) {
  if (intent === "thickness") {
    return [
      "型ガラスの板厚だね。",
      "型ガラスは、4ミリ、6ミリのかすみ柄が出ているよ。",
    ].join("\n");
  }

  if (intent === "manufacturing") {
    return [
      "型ガラスは、ガラスの表面に型模様をつけて作るよ。",
      "ロールなどで模様を転写して、光を通しながら視線をぼかす見え方にしている。",
    ].join("\n");
  }

  if (intent === "caution") {
    return [
      "型ガラスの注意点だね。",
      "目隠し用として使いやすいけど、防犯・断熱・防音を目的にしたガラスではないよ。",
      "模様の見え方で印象が変わるから、実物サンプルで透け感を確認してから決めると安心。",
    ].join("\n");
  }

  return [
    "型ガラスは、表面の模様で視線をぼかしながら光を入れられる板ガラスだよ。",
    "ガラスの表面に型模様をつけて、向こう側の形をはっきり見えにくくしている。",
    "浴室、洗面所、トイレ、玄関まわりなど、採光と目隠しを両立したい場所におすすめ。",
    "お客様には「明るさを取り入れながら、外からの視線をやわらかくさえぎるガラス」と説明するといいよ。",
  ].join("\n");
}

function getFrostedGlassReply(intent) {
  if (intent === "thickness") {
    return [
      "すりガラスの板厚だね。",
      "すりガラスは、3ミリ、5ミリが出ているよ。",
    ].join("\n");
  }

  if (intent === "manufacturing") {
    return [
      "すりガラスは、透明な板ガラスの表面を不透明に加工して作るよ。",
      "全体的に白っぽく、やわらかくぼかす見え方になる。",
    ].join("\n");
  }

  if (intent === "caution") {
    return [
      "すりガラスの注意点だね。",
      "水に濡れると透明に近くなって、透けやすくなることがあるよ。",
      "浴室みたいに水がかかる場所なら、型ガラスの方が扱いやすいことが多い。",
    ].join("\n");
  }

  return [
    "すりガラスは、透明な板ガラスの表面を白っぽくぼかした目隠し用のガラスだよ。",
    "透明ガラスの片面を不透明に加工して、全体的にやわらかく光を通す見え方にしている。",
    "間仕切り、建具、落ち着いた雰囲気にしたい窓まわりなど、白くやわらかくぼかしたい場所におすすめ。",
    "お客様には「光を入れながら、全体を白っぽくやさしくぼかすガラス」と説明するといいよ。",
  ].join("\n");
}

function findMentionedProducts(normalizedQuestion) {
  return products.filter((product) =>
    [product.name, ...product.aliases].some((word) =>
      normalizedQuestion.includes(word.toLowerCase()),
    ),
  );
}

function formatComparisonReply(firstProduct, secondProduct) {
  const first = getProductComparisonPoint(firstProduct);
  const second = getProductComparisonPoint(secondProduct);
  const use = getComparisonUseAdvice(firstProduct, secondProduct);

  return [
    `${firstProduct.name}と${secondProduct.name}の違いだね。`,
    `${firstProduct.name}は、${first.summary}`,
    `${secondProduct.name}は、${second.summary}`,
    use,
    "迷ったら、使う場所、困りごと、優先したい性能を教えて。俺が選び方をもう少し絞るよ。",
  ].join("\n");
}

function getProductComparisonPoint(product) {
  const points = {
    "スペーシア": {
      summary: "既存サッシを活かした断熱改修に使いやすい真空ガラス。冬の寒さや結露対策を重視するときに見やすい。",
      priority: "断熱・結露軽減",
    },
    "スペーシア クール": {
      summary: "真空ガラスの断熱性に、夏の日射熱を抑える性格を足したタイプ。暑さと寒さの両方を見たい窓向け。",
      priority: "断熱・遮熱",
    },
    "ペアマルチレイボーグ": {
      summary: "住宅向けの遮熱重視Low-E複層ガラス。夏の暑さ、冷房負荷、紫外線対策を見たいときに向いている。",
      priority: "遮熱・紫外線対策",
    },
    "ペアマルチスーパー": {
      summary: "住宅向けの断熱重視Low-E複層ガラス。冬の暖かさや寒冷地での快適性を見たいときに向いている。",
      priority: "冬の断熱",
    },
    "ペアマルチEA": {
      summary: "自然な見え方を保ちながら断熱したいときのLow-E複層ガラス。色味を変えにくい案件で使いやすい。",
      priority: "自然な見た目・断熱",
    },
    "ペアマルチLow-E": {
      summary: "ビル向けに色調や遮熱性能を選びやすいLow-E複層ガラス。外観デザインと省エネを一緒に考える商品だね。",
      priority: "ビル外装・遮熱",
    },
    "ペアマルチ": {
      summary: "標準的な複層ガラス。特別な遮熱や防犯より、まず基本の断熱性能を上げたいときの基準になる。",
      priority: "基本の断熱",
    },
    "セキュオ / セキュオプラス": {
      summary: "侵入対策を目的にした防犯ガラス。割られても穴を開けにくくして、侵入に時間をかけさせる考え方の商品。",
      priority: "防犯",
    },
    "ラミペーン / カラーラミペーン": {
      summary: "割れたときの飛散を抑える合わせガラス。安全性や紫外線カットを見たい場所に向いている。",
      priority: "安全・飛散防止",
    },
    "ソノグラス": {
      summary: "騒音対策のための防音合わせガラス。道路、鉄道、空港、工場近くなど音の悩みがある場所向け。",
      priority: "防音",
    },
    "フロート板ガラス": {
      summary: "透明でゆがみの少ない基本の板ガラス。機能よりも透明性や平滑性が必要なときに使う。",
      priority: "透明性・基本用途",
    },
    "すりガラス / 型ガラス": {
      summary: "視線をさえぎりながら光を入れる板ガラス。浴室、洗面、間仕切りなどプライバシー用途で使いやすい。",
      priority: "目隠し・採光",
    },
  };

  return points[product.name] || {
    summary: getPlainSummary(product),
    priority: product.category,
  };
}

function getComparisonUseAdvice(firstProduct, secondProduct) {
  const pair = [firstProduct.name, secondProduct.name].sort().join(" / ");
  const advice = {
    ["スペーシア / ペアマルチ"]: "選び方としては、既存窓の断熱改修や薄さを重視するならスペーシア、標準的な複層ガラスで基本断熱を見たいならペアマルチ、という分け方がしやすい。",
    ["スペーシア / スペーシア クール"]: "選び方としては、冬の寒さ・結露が主役ならスペーシア、夏の日射熱も強く抑えたいならスペーシア クールを見るといい。",
    ["スペーシア クール / ペアマルチレイボーグ"]: "どちらも暑さ対策に使えるけど、既存サッシを活かした真空ガラス寄りならスペーシア クール、住宅向けLow-E複層ガラスとして遮熱を見たいならペアマルチレイボーグだね。",
    ["ペアマルチスーパー / ペアマルチレイボーグ"]: "冬の断熱を重視するならペアマルチスーパー、夏の日射や紫外線対策を重視するならペアマルチレイボーグ、という見方が分かりやすい。",
    ["ペアマルチ / ペアマルチLow-E"]: "基本の複層ガラスで足りるならペアマルチ、遮熱や断熱をさらに見たい、特にビル外装で色調も選びたいならペアマルチLow-Eが候補になる。",
    ["セキュオ / セキュオプラス / ラミペーン / カラーラミペーン"]: "防犯が目的ならセキュオ、安全性や飛散防止が目的ならラミペーン、という分け方がいい。似て見えて、目的がかなり違う。",
    ["セキュオ / セキュオプラス / ソノグラス"]: "侵入対策ならセキュオ、騒音対策ならソノグラス。どちらも合わせガラス系だけど、主目的が防犯か防音かで分ける。",
    ["ラミペーン / カラーラミペーン / ソノグラス"]: "安全性や飛散防止ならラミペーン、音の悩みが主役ならソノグラス。学校や病院でも、何を解決したいかで候補が変わる。",
    ["フロート板ガラス / すりガラス / 型ガラス"]: "透明で見通したいならフロート板ガラス、目隠ししながら採光したいならすりガラスや型ガラスを見るといい。",
  };

  return advice[pair] || `選び方としては、${firstProduct.name}は「${getProductComparisonPoint(firstProduct).priority}」を重視するとき、${secondProduct.name}は「${getProductComparisonPoint(secondProduct).priority}」を重視するときに見やすい。`;
}

function getQuestionIntent(normalizedQuestion) {
  const intents = [
    { id: "manufacturing", words: ["作ら", "作る", "作り方", "製造", "製法"] },
    { id: "thickness", words: ["板厚", "厚み", "厚さ", "何ミリ", "なんミリ", "ミリ", "呼び厚"] },
    { id: "use", words: ["用途", "使い方", "どこ", "どんな場所", "おすすめ", "向いて", "使える"] },
    { id: "performance", words: ["性能", "断熱", "遮熱", "防音", "遮音", "防犯", "紫外線", "結露", "熱貫流", "日射"] },
    { id: "caution", words: ["注意", "気をつけ", "確認", "デメリット", "弱点", "だめ", "ダメ"] },
    { id: "summary", words: ["簡単", "ざっくり", "つまり", "何", "どんな"] },
  ];

  return intents.find((intent) => intent.words.some((word) => normalizedQuestion.includes(word)))?.id || "";
}

function formatProductIntentReply(product, intent) {
  const profile = getProductAdvice(product);

  const replies = {
    thickness: getThicknessReply(product),
    use: [
      `${product.name}のおすすめの使い方だね。`,
      profile.recommendation,
    ].join("\n"),
    performance: [
      `${product.name}の性能面は、こう整理すると分かりやすいよ。`,
      getPlainPerformance(product),
    ].join("\n"),
    caution: [
      `${product.name}で気をつけたいところだね。`,
      profile.checkpoint,
    ].filter(Boolean).join("\n"),
    manufacturing: getManufacturingReply(product, ""),
    summary: formatProductReply(product),
  };

  return replies[intent] || formatProductReply(product);
}

function getManufacturingReply(product, normalizedQuestion) {
  if (normalizedQuestion) {
    const qaAnswer = getManufacturingQaAnswer(normalizedQuestion);
    if (qaAnswer) return qaAnswer;
  }

  const manufacturing = {
    "スペーシア": [
      "スペーシアの作り方は、ざっくり言うと「2枚のガラスの間に真空層を作る」仕組みだよ。",
      "ガラス同士を細かいスペーサーで支えて、すき間を真空に近い状態にすることで、熱が伝わりにくくなる。",
      "普通の複層ガラスより薄い構成で断熱しやすいのが特徴だね。",
    ],
    "スペーシア クール": [
      "スペーシア クールも、基本はスペーシアと同じ真空ガラスの作り方だよ。",
      "2枚のガラスの間に真空層を作って、さらに日差し対策に向いたLow-E膜を組み合わせている。",
      "だから断熱だけじゃなく、夏の日射を抑えたい窓にも使いやすいんだ。",
    ],
    "ペアマルチレイボーグ": [
      "ペアマルチレイボーグは、2枚のガラスの間に中空層を作る複層ガラスだよ。",
      "そのうえで、日射を抑えるLow-Eガラスを組み合わせて作られる。",
      "暑さ対策や西日対策を見たいときに話しやすい構成だね。",
    ],
    "ペアマルチスーパー": [
      "ペアマルチスーパーは、2枚のガラスの間に中空層を作る複層ガラスだよ。",
      "Low-Eガラスを組み合わせて、冬の暖かさを逃がしにくい方向に性能を持たせている。",
      "寒さ対策を重視する窓で候補にしやすいタイプだね。",
    ],
    "ペアマルチEA": [
      "ペアマルチEAは、2枚のガラスの間に中空層を作る複層ガラスだよ。",
      "自然な見え方を保ちやすいLow-Eガラスを組み合わせて、断熱性も見た目も両立しやすくしている。",
      "色味をあまり変えたくない案件で説明しやすいね。",
    ],
    "ペアマルチLow-E": [
      "ペアマルチLow-Eは、2枚のガラスの間に中空層を作る複層ガラスだよ。",
      "そこにLow-Eガラスを組み合わせて、断熱や遮熱の方向性を選べるようにしている。",
      "窓の方角や困りごとに合わせてタイプを選ぶ感じだね。",
    ],
    "ペアマルチ": [
      "ペアマルチは、2枚のガラスを使って、その間に中空層を作る複層ガラスだよ。",
      "中空層があることで、1枚ガラスより熱が伝わりにくくなる。",
      "標準的な断熱用の複層ガラスとして考えると分かりやすい。",
    ],
    "セキュオ / セキュオプラス": [
      "セキュオは、ガラスとガラスの間に防犯用の中間膜を挟んで作る合わせガラスだよ。",
      "セキュオプラスは、さらにポリカーボネート板を組み合わせて、こじ破りや打ち破りへの抵抗を高めている。",
      "侵入に時間をかけさせるための構成、と覚えると分かりやすいね。",
    ],
    "ラミペーン / カラーラミペーン": [
      "ラミペーンは、2枚以上のガラスの間に中間膜を挟んで接着した合わせガラスだよ。",
      "割れたときに破片が飛び散りにくいように、中間膜がガラスをつなぎ止める仕組みになっている。",
      "カラーラミペーンは、その中間膜に色を持たせたタイプだね。",
    ],
    "ソノグラス": [
      "ソノグラスは、ガラスとガラスの間に特殊な中間膜を挟んで作る合わせガラスだよ。",
      "その中間膜が音の振動を抑える役割をして、防音性を高めている。",
      "道路沿いや音が気になる部屋で候補にしやすい構成だね。",
    ],
    "テンパライト / ミストロンエース": [
      "強化ガラスは、板ガラスを熱処理して強度を高めて作るガラスだよ。",
      "AGCのカタログでは、テンパライトが透明タイプ、ミストロンエースが視線を遮る型板タイプとして紹介されている。",
      "割れたときに細かい粒状になりやすいから、安全設計が必要な場所で候補にしやすいね。",
    ],
    "ヒシワイヤ / クロスワイヤ / プロテックス": [
      "網入りガラスは、ガラスの中に金網を封入して作るガラスだよ。",
      "AGCのカタログでは、ヒシワイヤとクロスワイヤが網入板ガラス、プロテックスが線入板ガラスとして整理されている。",
      "ヒシワイヤとクロスワイヤは防火、プロテックスは飛散低減が主目的、と分けて覚えると分かりやすい。",
    ],
    "フロート板ガラス": [
      "透明ガラスは、主にフロート法で作られるよ。",
      "溶かしたガラスを、溶けたスズの上に浮かべて平らな板にする作り方なんだ。",
      "そのあと、ゆっくり冷まして必要なサイズに切る。だから表面がなめらかで、ゆがみの少ない板ガラスになりやすいんだよ。",
    ],
    "すりガラス / 型ガラス": [
      "すりガラスと型ガラスは、どちらも透明な板ガラスをベースにして見え方を変えたガラスだよ。",
      "すりガラスは、表面を不透明に加工して、白っぽくやわらかくぼかす。",
      "型ガラスは、ガラスの表面に型模様をつけて、光を入れながら視線をさえぎる作り方だね。",
    ],
  };

  const reply = manufacturing[product.name];
  if (Array.isArray(reply)) return reply.join("\n");

  return reply || [
    `${product.name}の作られ方だね。`,
    "ごめんね、その商品の詳しい製造工程はまだ学んでいないんだ。",
    "今答えられるのは、商品の特徴や使い分けまで。製法のQ&Aを追加してくれたら、そこから案内できるよ。",
  ].join("\n");
}

function getThicknessReply(product) {
  const thickness = {
    "スペーシア": "カタログ上は、呼び厚さ6.2ミリ、8.2ミリ、10.2ミリ、10ミリの構成が出ているよ。代表的には6.2ミリが、既存の一枚ガラス用サッシに納まりやすいタイプとして説明されている。",
    "スペーシア クール": "カタログ上は、呼び厚さ6.2ミリ、8.2ミリ、10.2ミリ、10ミリの構成が出ているよ。透明・不透明やガラス構成で変わるから、実際は品種表で確認しよう。",
    "ペアマルチレイボーグ": "構成はLow-E3、Low-E4、Low-E5に中空層Aとフロート板ガラスを組み合わせる形だよ。呼び厚さは中空層の厚みに左右されるから、サッシ溝幅と必要性能を見て決める。",
    "ペアマルチスーパー": "構成はFL3、FL4、FL5に中空層AとLow-Eガラスを組み合わせる形だよ。呼び厚さは中空層の設定で変わるから、クリアSかグリーンSかも含めて確認しよう。",
    "ペアマルチEA": "Low-E3、4、5、6、8、10、12ミリに、中空層Aと同厚のフロート板ガラスを組み合わせる構成が出ているよ。大きいサイズや厚い構成は在庫確認が必要な場合がある。",
    "ペアマルチLow-E": "代表例では、FL6と中空層を組み合わせた呼び厚さ18ミリ、24ミリの性能表が出ているよ。色や膜面、構成で変わるから、品種ごとに確認しよう。",
    "ペアマルチ": "FL3、4、5、6、8、10、12ミリに中空層Aを組み合わせる構成が出ているよ。呼び厚さはガラス厚と中空層の合計で決まる。",
    "セキュオ / セキュオプラス": "品種によって違うよ。セキュオ30は中間膜約0.8ミリ、60は約1.5ミリ、90は約2.3ミリ。呼び厚さは構成によって6.8ミリから25ミリ程度まで出ている。",
    "ラミペーン / カラーラミペーン": "代表的には6.4、6.8、8.4、10.4、16.8、24.8ミリなどの呼び厚さが出ているよ。中間膜は15milが約0.4ミリ、30milが約0.8ミリ。",
    "ソノグラス": "住宅用では6.8ミリ、建築用では12.8ミリなどの構成が出ているよ。防音特殊中間膜30mil、つまり約0.8ミリを挟むタイプだね。",
    "テンパライト / ミストロンエース": "厚みは、テンパライトが4、5、6、8、10、12、15、19ミリ。熱線吸収テンパライトは5、6、8ミリ、サンルックスTテンパライトは6、8ミリ、テンパライトNSは4、5ミリ、ミストロンエースは4ミリだよ。",
    "ヒシワイヤ / クロスワイヤ / プロテックス": "厚みは、磨クロスワイヤ、霞クロスワイヤ、霞ヒシワイヤ、磨プロテックス、霞プロテックスが6.8ミリ。磨ヒシワイヤは6.8ミリと10ミリがあるよ。",
    "フロート板ガラス": "フロート板ガラスは、呼び厚さ2、3、5、6、8、10、12、15、19ミリが出ているよ。一般的な透明板ガラスなら、まずこの厚みから用途に合わせて見る感じだね。",
    "すりガラス / 型ガラス": "すりガラスは3ミリ、5ミリ。型ガラスは4ミリ、6ミリのかすみ柄が出ているよ。目隠し用途なら、厚みだけじゃなく見え方も確認しよう。",
  };

  return [
    `${product.name}の板厚だね。`,
    thickness[product.name] || "この商品の板厚は構成で変わるから、品種表とサッシ条件を一緒に確認しよう。",
  ].join("\n");
}

function getProductRecommendation(normalizedQuestion) {
  const groups = [
    {
      words: ["断熱", "寒い", "結露", "省エネ", "暖房"],
      names: ["スペーシア", "スペーシア クール", "ペアマルチスーパー", "ペアマルチEA", "ペアマルチ"],
    },
    {
      words: ["遮熱", "暑い", "冷房", "日射", "紫外線"],
      names: ["スペーシア クール", "ペアマルチレイボーグ", "ペアマルチLow-E"],
    },
    {
      words: ["防犯", "侵入", "こじ破り", "打ち破り", "店舗"],
      names: ["セキュオ / セキュオプラス"],
    },
    {
      words: ["防音", "遮音", "騒音", "音"],
      names: ["ソノグラス", "スペーシア"],
    },
    {
      words: ["安全", "飛散", "学校", "病院", "合わせ"],
      names: ["ラミペーン / カラーラミペーン", "セキュオ / セキュオプラス", "ソノグラス"],
    },
    {
      words: ["目隠し", "プライバシー", "浴室", "洗面", "採光"],
      names: ["すりガラス / 型ガラス"],
    },
    {
      words: ["透明", "一般", "ショーケース", "ディスプレイ"],
      names: ["フロート板ガラス", "ペアマルチEA", "ペアマルチ"],
    },
  ];

  const group = groups.find((item) =>
    item.words.some((word) => normalizedQuestion.includes(word.toLowerCase())),
  );

  if (!group) return [];
  return group.names
    .map((name) => products.find((product) => product.name === name))
    .filter(Boolean)
    .slice(0, 4);
}

function formatProductReply(product) {
  const structuredOverview = getStructuredProductOverview(product);
  if (structuredOverview) return structuredOverview;

  const profile = getProductAdvice(product);

  return [
    profile.opening,
    profile.recommendation,
  ].join("\n");
}

function getStructuredProductOverview(product) {
  const overviews = {
    "スペーシア": {
      what: "スペーシアは、既存の窓を活かしながら断熱性を上げやすい真空ガラスだよ。",
      structure: "2枚のガラスの間に真空層を作って、Low-E膜も組み合わせることで熱を伝わりにくくしている。",
      use: "冬に窓際が寒い部屋、結露が出やすい窓、サッシは大きく変えずに断熱改修したい場所におすすめ。",
      customer: "お客様には「今の窓まわりを活かしながら、寒さや結露を抑えやすい薄型の高断熱ガラス」と説明するといいよ。",
    },
    "スペーシア クール": {
      what: "スペーシア クールは、断熱に加えて夏の暑さ対策も見たい真空ガラスだよ。",
      structure: "真空層で熱を伝わりにくくしながら、遮熱高断熱Low-E膜で日射熱も抑える構造になっている。",
      use: "西日が強い部屋、夏に室温が上がりやすい窓、冷房効率と冬の断熱を両方見たい場所におすすめ。",
      customer: "お客様には「冬の寒さだけでなく、夏の日差しの暑さも抑えやすい真空ガラス」と説明するといいよ。",
    },
    "ペアマルチレイボーグ": {
      what: "ペアマルチレイボーグは、夏の暑さ対策を重視した住宅向けのLow-E複層ガラスだよ。",
      structure: "2枚のガラスの間に中空層を作り、室外側のLow-E膜で日射熱を抑える構造になっている。",
      use: "西日が強いリビング、夏に室温が上がりやすい窓、冷房負荷や紫外線を抑えたい場所におすすめ。",
      customer: "お客様には「夏の日差しや暑さを抑えながら、断熱性も見られる住宅向け複層ガラス」と説明するといいよ。",
    },
    "ペアマルチスーパー": {
      what: "ペアマルチスーパーは、冬の暖かさを重視する住宅向けのLow-E複層ガラスだよ。",
      structure: "2枚のガラスの間に中空層を作り、Low-Eガラスで室内の暖房熱を逃がしにくくしている。",
      use: "寒冷地の住宅、冬に窓際が冷える部屋、暖房効率を上げたい窓におすすめ。",
      customer: "お客様には「冬の暖房熱を逃がしにくくして、窓まわりの寒さを抑えやすい複層ガラス」と説明するといいよ。",
    },
    "ペアマルチEA": {
      what: "ペアマルチEAは、自然な見え方と断熱性を両立しやすいLow-E複層ガラスだよ。",
      structure: "Low-Eガラスと中空層を組み合わせて、明るさや透明感を保ちながら熱を伝わりにくくしている。",
      use: "色味をあまり変えたくない住宅やビルの窓、明るさを保ちたい開口部におすすめ。",
      customer: "お客様には「見た目の自然さを保ちながら、冷暖房の負担を下げやすいLow-Eガラス」と説明するといいよ。",
    },
    "ペアマルチLow-E": {
      what: "ペアマルチLow-Eは、ビル向けに遮熱や断熱、色調を選びやすいLow-E複層ガラスだよ。",
      structure: "Low-E膜を持つガラスと中空層を組み合わせて、日射や熱の入り方を調整する構造になっている。",
      use: "ビルの外装、大きな開口部、外観の色味と省エネ性を一緒に考えたい場所におすすめ。",
      customer: "お客様には「外観の印象を選びながら、遮熱や断熱も見られるビル向け複層ガラス」と説明するといいよ。",
    },
    "ペアマルチ": {
      what: "ペアマルチは、基本の断熱性能を上げたいときに使いやすい標準的な複層ガラスだよ。",
      structure: "2枚のガラスの間に中空層を作って、1枚ガラスより熱を伝わりにくくしている。",
      use: "住宅やビルの一般的な窓、まず断熱性や結露軽減を見たい場所におすすめ。",
      customer: "お客様には「2枚のガラスと空気層で、基本的な断熱性を高める複層ガラス」と説明するといいよ。",
    },
    "セキュオ / セキュオプラス": {
      what: "セキュオは、侵入対策を目的にした防犯合わせガラスだよ。",
      structure: "ガラスとガラスの間に防犯用の中間膜やポリカーボネート板を挟んで、割られても穴を開けにくくしている。",
      use: "戸建てや店舗の出入口、侵入が心配な窓、守りたい物があるショーケースまわりにおすすめ。",
      customer: "お客様には「割られてもすぐに侵入しにくくして、ガラス破りに時間をかけさせる防犯ガラス」と説明するといいよ。",
    },
    "ラミペーン / カラーラミペーン": {
      what: "ラミペーンは、割れたときの安全性を高めたい場所に向く合わせガラスだよ。",
      structure: "2枚以上のガラスの間に中間膜を挟んで、割れても破片が飛び散りにくい構造になっている。",
      use: "学校、病院、浴室まわり、ベランダ、トップライトなど、破片の飛散を抑えたい場所におすすめ。",
      customer: "お客様には「割れても中間膜が破片を支えて、飛び散りにくくする安全性重視のガラス」と説明するといいよ。",
    },
    "ソノグラス": {
      what: "ソノグラスは、外の音や室内の音漏れを抑えたいときの防音合わせガラスだよ。",
      structure: "2枚のガラスの間に防音特殊中間膜を挟んで、音の振動を伝わりにくくしている。",
      use: "道路、鉄道、空港、工場の近くや、騒音が気になる住宅・オフィスにおすすめ。",
      customer: "お客様には「防音特殊中間膜で音を伝わりにくくする、防音対策向けの合わせガラス」と説明するといいよ。",
    },
    "テンパライト / ミストロンエース": {
      what: "強化ガラスは、通常の板ガラスより強度を高めた安全性重視のガラスだよ。",
      structure: "板ガラスを熱処理して強度を高め、割れたときに細かい粒状になりやすくしている。",
      use: "安全設計が必要な開口部、店舗、オフィス、学校、公共施設など人が集まる場所におすすめ。",
      customer: "お客様には「割れたときの大きなけがを減らしやすい、強度を高めた安全ガラス」と説明するといいよ。",
    },
    "ヒシワイヤ / クロスワイヤ / プロテックス": {
      what: "網入りガラスは、防火や飛散低減を見たい場所で使うガラスだよ。",
      structure: "ガラスの中に金網や金属線を封入して、割れたときに破片を支えやすくしている。",
      use: "延焼のおそれのある開口部、トップライト、防煙垂れ壁などにおすすめ。",
      customer: "お客様には「金網や金属線で破片を支え、防火や飛散低減を目的に使うガラス」と説明するといいよ。",
    },
    "フロート板ガラス": {
      what: "フロート板ガラス、つまり透明ガラスは、いちばん基本になる板ガラスだよ。",
      structure: "溶かしたガラスを溶けたスズの上に浮かべて平らにする、フロート法で作られる。",
      use: "一般住宅や店舗の窓、ショーケース、ディスプレイ、家具、額縁など透明に見せたい場所におすすめ。",
      customer: "お客様には「透明でゆがみが少なく、いろいろな機能ガラスのベースにもなる基本の板ガラス」と説明するといいよ。",
    },
    "すりガラス / 型ガラス": {
      what: "すりガラスや型ガラスは、目隠ししながら光を入れたい場所に使いやすいガラスだよ。",
      structure: "すりガラスは表面を不透明に加工し、型ガラスは表面に型模様をつけて視線をぼかしている。",
      use: "浴室、洗面所、トイレ、玄関まわりなど、採光と目隠しを両立したい場所におすすめ。",
      customer: "お客様には「明るさを取り入れながら、視線をやわらかくさえぎる目隠し用のガラス」と説明するといいよ。",
    },
  };

  const overview = overviews[product.name];
  if (!overview) return "";

  return [
    overview.what,
    overview.structure,
    overview.use,
    overview.customer,
  ].join("\n");
}

function getRichProductOverview(product) {
  const overviews = {
    "ペアマルチ": [
      "ペアマルチは、2枚のガラスの間に中空層を作った、標準的な複層ガラスだよ。",
      "1枚ガラスより熱が伝わりにくくなるから、まず基本の断熱性を上げたい窓で使いやすい。",
      "特別な遮熱・防犯・防音を強く狙う商品というより、住宅やビルの窓で断熱の基準になるタイプだね。",
      "寒さや結露をもう少し抑えたいけど、まずはシンプルに複層ガラスで考えたい時に候補にしやすいよ。",
    ],
    "ペアマルチスーパー": [
      "ペアマルチスーパーは、冬の暖かさを重視する住宅向けのLow-E複層ガラスだよ。",
      "2枚のガラスの間に中空層を作って、Low-Eガラスで室内の暖房熱を逃がしにくくする考え方の商品なんだ。",
      "寒冷地の住宅、冬に窓際が冷える部屋、暖房効率を上げたい窓に向いている。",
      "日射を取り込みたいのか、夏の暑さも少し抑えたいのかで、クリアSやグリーンSの考え方も変わるよ。",
    ],
    "ペアマルチレイボーグ": [
      "ペアマルチレイボーグは、夏の暑さ対策を重視した住宅向けのLow-E複層ガラスだよ。",
      "室外側ガラスのLow-E膜で日射熱を抑えながら、複層ガラスとして断熱性も見られるタイプなんだ。",
      "西日が強いリビング、夏に室温が上がりやすい窓、冷房負荷や紫外線を抑えたい場所に向いている。",
      "冬の断熱よりも、夏の日差し・暑さ・家具の日焼け対策を優先したい時に候補にしやすいよ。",
    ],
  };

  return overviews[product.name]?.join("\n") || "";
}

function getProductAdvice(product) {
  const advice = {
    "スペーシア": {
      opening: "スペーシアは、既存の窓を大きく変えずに断熱を上げたいときの本命候補だよ。",
      recommendation: "おすすめの使い方は、冬に窓際が寒い部屋、結露が出やすい部屋、暖房効率を上げたい住宅の窓。特に「サッシはそのまま活かしたい」という相談と相性がいい。",
      bestUse: "説明するときは「真空層で熱を逃がしにくくする薄型の高断熱ガラス」と言うと伝わりやすい。",
      checkpoint: "確認したいのは、既存サッシの溝幅、ガラス寸法、方角、結露の出方。熱割れや耐風圧の検討も必要だね。",
      close: "俺なら、寒さ・結露の相談にはまずスペーシアを候補に入れる。",
    },
    "スペーシア クール": {
      opening: "スペーシア クールは、断熱だけじゃなく夏の暑さ対策もしたい窓向けだよ。",
      recommendation: "おすすめの使い方は、西日が強い部屋、夏に室温が上がりやすい窓、冷房効率を上げたい住宅の開口部。冬の断熱も見たいけど、夏の遮熱も外せないときに選びやすい。",
      bestUse: "お客さんには「スペーシアの断熱性に、日射熱を抑える性格を足したタイプ」と説明すると分かりやすい。",
      checkpoint: "注意点は、採光や見え方も一緒に確認すること。遮熱寄りの商品は、方角や部屋の使い方で向き不向きが出る。",
      close: "暑さと寒さの両方を相談されたら、俺はスペーシア クールを強めに見る。",
    },
    "ペアマルチレイボーグ": {
      opening: "ペアマルチレイボーグは、住宅向けの遮熱重視Low-E複層ガラスだよ。",
      recommendation: "おすすめの使い方は、日射が入りすぎるリビング、夏の冷房負荷を下げたい窓、紫外線による家具やカーテンの色あせを抑えたい場所。",
      bestUse: "説明では「夏の熱を入りにくくして、冬の断熱も助ける住宅向けの複層ガラス」と言うと通りがいい。",
      checkpoint: "確認したいのは、日射をどれくらい抑えたいか、室内をどれくらい明るく保ちたいか、窓の方角。色調サンプル確認も大事。",
      close: "夏の暑さ・紫外線・住宅用という条件なら、まず候補に入れたい商品だね。",
    },
    "ペアマルチスーパー": {
      opening: "ペアマルチスーパーは、冬の暖かさを重視する住宅向けLow-E複層ガラスだよ。",
      recommendation: "おすすめの使い方は、寒冷地の住宅、冬に窓際が冷える部屋、日射も取り入れながら断熱したい窓。クリアSとグリーンSで考え方が少し変わる。",
      bestUse: "説明するときは「冬の暖房熱を逃がしにくくする、住宅向けの断熱タイプ」と言うと分かりやすい。",
      checkpoint: "日射を取り込みたいのか、少し遮りたいのかを先に確認しよう。寒冷地ならクリアS、夏の暑さも気になるならグリーンSのように考えやすい。",
      close: "冬の快適性を主役にするなら、俺はペアマルチスーパーを見に行く。",
    },
    "ペアマルチEA": {
      opening: "ペアマルチEAは、自然な見え方と断熱を両立しやすいLow-E複層ガラスだよ。",
      recommendation: "おすすめの使い方は、住宅やビルで「色味をあまり変えたくない」「明るさを保ちたい」けど断熱性も上げたい窓。",
      bestUse: "案内では「見た目の自然さを保ちながら、冷暖房負荷を下げるLow-E」と伝えると使いやすい。",
      checkpoint: "大きいサイズや厚い構成では在庫・製作条件の確認が必要。中空層や面積制限も見よう。",
      close: "見た目の自然さを大事にする案件なら、俺はEAを候補に残す。",
    },
    "ペアマルチLow-E": {
      opening: "ペアマルチLow-Eは、ビル向けに色調や遮熱性能を選びたいときのLow-E複層ガラスだよ。",
      recommendation: "おすすめの使い方は、ビルの外装、ファサード、日射を抑えたい大きな開口部。色や反射感も設計意図に合わせて選びやすい。",
      bestUse: "説明では「冷房負荷を抑えながら、外観の色味も選べるビル向け複層ガラス」と言うといい。",
      checkpoint: "注意点は、色調・反射・可視光透過率のバランス。標準色か準標準色かで納期や条件も変わる可能性がある。",
      close: "外観デザインと省エネを一緒に見たい案件なら、俺はこれを推す。",
    },
    "ペアマルチ": {
      opening: "ペアマルチは、いちばん標準的に説明しやすい複層ガラスだよ。",
      recommendation: "おすすめの使い方は、まず断熱性を上げたい一般的な住宅・ビルの窓。特別な遮熱や防犯より、基本性能を整えたいときに向いている。",
      bestUse: "説明するときは「2枚のガラスの間の空気層で、熱を伝わりにくくする基本の複層ガラス」と言うと伝わりやすい。",
      checkpoint: "もっと高い断熱、遮熱、防犯、防音が必要なら別商品と比較しよう。サッシ溝幅や中空層の条件も確認がいる。",
      close: "迷ったときの基準点として、俺はペアマルチを置く。",
    },
    "セキュオ / セキュオプラス": {
      opening: "セキュオは、防犯を目的に選ぶ合わせガラスだよ。",
      recommendation: "おすすめの使い方は、戸建てや店舗の出入口、侵入が心配な窓、貴金属店や展示ケースみたいに守りたい物がある場所。",
      bestUse: "説明では「割れてもすぐ穴を開けにくくして、侵入に時間をかけさせるガラス」と言うと分かりやすい。",
      checkpoint: "防犯目的なら、ガラスだけでなくサッシ、鍵、フィルム、面格子、運用もセットで見るのが大事。PYは室内側指定にも注意だね。",
      close: "防犯相談なら、俺はセキュオの30・60・90・SPのどのレベルが必要かから整理する。",
    },
    "ラミペーン / カラーラミペーン": {
      opening: "ラミペーンは、割れたときの安全性を高めたい場所に向く合わせガラスだよ。",
      recommendation: "おすすめの使い方は、学校、病院、浴室まわり、ベランダ、トップライト、ガラス屋根みたいに、破片の飛散を抑えたい場所。",
      bestUse: "説明では「割れても中間膜が破片を支えて、飛び散りにくくするガラス」と言うと伝わりやすい。",
      checkpoint: "防犯目的ならセキュオ、防音目的ならソノグラスも比較しよう。カラー品は見え方と採光も確認したい。",
      close: "安全性メインならラミペーン、色や意匠も必要ならカラーラミペーンを見るといい。",
    },
    "ソノグラス": {
      opening: "ソノグラスは、音の悩みに使う防音合わせガラスだよ。",
      recommendation: "おすすめの使い方は、道路・鉄道・空港・工場の近く、外の騒音が気になる住宅やオフィス。室内の音漏れを抑えたい場所にも候補になる。",
      bestUse: "説明では「防音特殊中間膜で音の振動を吸収し、騒音を伝わりにくくするガラス」と言うと分かりやすい。",
      checkpoint: "防音はガラス単体だけでは決まらない。サッシ、すき間、換気口、壁も一緒に見る必要がある。",
      close: "音の相談なら、俺はまずソノグラスとサッシ条件をセットで確認する。",
    },
    "テンパライト / ミストロンエース": {
      opening: "強化ガラスは、通常の板ガラスより強度を高めた、安全性を見たい場所向けのガラスだよ。",
      recommendation: "おすすめの使い方は、安全設計が必要な開口部、人が集まる施設、店舗やオフィス、マンションまわり。透明で見せたいならテンパライト、目隠しも必要ならミストロンエースが候補になる。",
      bestUse: "説明では「同じ厚さの通常の板ガラスより強度が高く、割れても細かい粒状になりやすいガラス」と言うと伝わりやすい。",
      checkpoint: "注意点は、傷への配慮、熱処理による反射像・透視像のゆがみ、不意の破損リスク。清掃時は金属製の道具を避けたいね。",
      close: "安全性と強度を見たいなら強化ガラス。ただし防犯や防火が目的なら、別の商品と目的を分けて考えよう。",
    },
    "ヒシワイヤ / クロスワイヤ / プロテックス": {
      opening: "網入りガラスは、ガラスの中に金網や金属線を入れて、防火や飛散低減を見たい場所で使うガラスだよ。",
      recommendation: "おすすめの使い方は、延焼のおそれのある開口部やトップライト。防煙垂れ壁など、飛散低減を見たい場所ではプロテックスも候補になる。",
      bestUse: "説明では「ヒシワイヤとクロスワイヤは防火目的、プロテックスは飛散低減目的」と分けると分かりやすい。",
      checkpoint: "注意点は、防火設備や特定防火設備はサッシとガラスを一体で個別認定すること。使えるかどうかは認定を取得したサッシメーカーなどへ確認が必要だね。",
      close: "防火が目的ならヒシワイヤかクロスワイヤ、飛散低減が目的ならプロテックス、とまず整理するといい。",
    },
    "フロート板ガラス": {
      opening: "フロート板ガラス、つまり透明ガラスは、いちばん基本になる板ガラスだよ。",
      recommendation: "表面がなめらかで、向こう側が見えやすく、見た目も自然。一般住宅や店舗の窓、ショーケース、ディスプレイ、家具、額縁みたいに「透明に見せたい」「中を見せたい」場所で使いやすい。",
      bestUse: "説明では「いろんな機能ガラスのベースにもなる、標準的な透明板ガラス」と言うと分かりやすい。フロート法で作られるから平滑性が高く、透視像や反射像がきれいに出やすいのも特徴だね。",
      checkpoint: "ただし、透明ガラス単体だと、断熱・遮熱・防犯・防音・飛散防止みたいな特別な性能は強くない。寒さならスペーシアやペアマルチ、防犯ならセキュオ、防音ならソノグラスみたいに、困りごとに合わせて機能ガラスを見た方がいい。",
      close: "まずは「透明で見せたいだけなのか」「何か困りごとを解決したいのか」を分けると選びやすいよ。",
    },
    "すりガラス / 型ガラス": {
      opening: "型ガラスやすりガラスは、目隠ししながら光を入れたい場所に使いやすいガラスだよ。",
      recommendation: "型ガラスは、表面の模様で視線をぼかすタイプ。浴室、洗面所、トイレ、玄関まわりみたいに、明るさはほしいけど丸見えは避けたい場所に向いている。一般的には「かすみ」柄の型ガラスがよく使われるね。",
      bestUse: "すりガラスは、透明ガラスの片面を不透明に加工したタイプで、全体的に白っぽくやわらかくぼかす印象になる。落ち着いた見え方にしたい場所には合うけど、水に濡れると透けやすくなることがあるから、浴室では型ガラスの方が扱いやすいことが多い。",
      checkpoint: "注意点は、どちらも目隠しや採光が主目的で、防犯・断熱・防音の性能を強く上げる商品ではないこと。防犯ならセキュオ、断熱ならスペーシアやペアマルチ、防音ならソノグラスも候補にしよう。",
      close: "目隠しと掃除のしやすさを重視するなら型ガラス、やわらかく白くぼかしたいならすりガラス、という分け方がしやすいよ。",
    },
  };

  return advice[product.name] || {
    opening: `${product.name}は、${getPlainSummary(product)}だよ。`,
    recommendation: `おすすめの使い方は、${product.useCases.slice(0, 2).join("、")}あたり。`,
    bestUse: getPlainPerformance(product),
    checkpoint: `確認したいのは、${product.cautions[0]}こと。`,
    close: "条件をもう少し教えてくれたら、俺が候補を絞る。",
  };
}

function getPlainBenefit(product) {
  const benefits = {
    "スペーシア": "冬の寒さや結露を抑えたい窓向け",
    "スペーシア クール": "断熱に加えて夏の日射熱も抑えたい窓向け",
    "ペアマルチレイボーグ": "住宅で夏の暑さ対策を重視したいとき向け",
    "ペアマルチスーパー": "冬の寒さ対策と採光を両立したい住宅向け",
    "ペアマルチEA": "自然な見え方のまま断熱したいビル・住宅向け",
    "ペアマルチLow-E": "ビルで遮熱・断熱・色調を選びたいとき向け",
    "ペアマルチ": "標準的な複層ガラスで断熱したいとき向け",
    "セキュオ / セキュオプラス": "侵入対策を重視する窓や出入口向け",
    "ラミペーン / カラーラミペーン": "割れたときの飛散を抑えたい場所向け",
    "ソノグラス": "騒音を抑えたい住宅やオフィス向け",
    "テンパライト / ミストロンエース": "強度と割れた時の安全性を見たい場所向け",
    "ヒシワイヤ / クロスワイヤ / プロテックス": "防火や飛散低減を見たい開口部向け",
    "フロート板ガラス": "透明で一般的な板ガラスが必要なとき向け",
    "すりガラス / 型ガラス": "採光しながら視線をさえぎりたい場所向け",
  };

  return benefits[product.name] || product.features[0];
}

function getPlainSummary(product) {
  const summaries = {
    "スペーシア": "いまの窓を活かしながら断熱性を上げやすい真空ガラス",
    "スペーシア クール": "暑さ対策も寒さ対策もしたい窓向けの真空ガラス",
    "ペアマルチレイボーグ": "住宅向けの、夏の熱を抑えるLow-E複層ガラス",
    "ペアマルチスーパー": "冬の暖かさを逃がしにくい住宅向けLow-E複層ガラス",
    "ペアマルチEA": "明るさと自然な見た目を保ちやすいLow-E複層ガラス",
    "ペアマルチLow-E": "ビル向けに色や遮熱性能を選べるLow-E複層ガラス",
    "ペアマルチ": "標準的に使いやすい断熱用の複層ガラス",
    "セキュオ / セキュオプラス": "割って侵入されにくくするための防犯ガラス",
    "ラミペーン / カラーラミペーン": "割れても破片が飛び散りにくい合わせガラス",
    "ソノグラス": "外の音や室内の音漏れを抑えたいときの防音合わせガラス",
    "テンパライト / ミストロンエース": "通常の板ガラスより高い強度を持ち、割れても粒状になりやすい強化ガラス",
    "ヒシワイヤ / クロスワイヤ / プロテックス": "金網や金属線を封入した、防火や飛散低減を目的に使うガラス",
    "フロート板ガラス": "透明でゆがみが少なく、窓やショーケースなど幅広く使える基本の板ガラス",
    "すりガラス / 型ガラス": "視線をぼかしながら光を入れられる、浴室や洗面まわりで使いやすい目隠し用の板ガラス",
  };

  return summaries[product.name] || product.features[0];
}

function getPlainPerformance(product) {
  const performances = {
    "スペーシア": "カタログでは、一般的な一枚ガラスよりかなり断熱しやすい商品として紹介されている。",
    "スペーシア クール": "カタログでは、日射熱を約51%カットする例が紹介されている。",
    "ペアマルチレイボーグ": "カタログでは、日射熱を約60%、紫外線を約82%カットする例が紹介されている。",
    "ペアマルチスーパー": "カタログでは、一般複層ガラスより断熱性能を高めた商品として紹介されている。",
    "ペアマルチEA": "カタログでは、透明感を保ちながら断熱と冷暖房負荷軽減に役立つ商品として紹介されている。",
    "ペアマルチLow-E": "カタログでは、遮熱と断熱で冷暖房負荷を下げる商品として紹介されている。",
    "ペアマルチ": "カタログでは、フロート板ガラスの約2倍の断熱性能と説明されている。",
    "セキュオ / セキュオプラス": "中間膜やポリカーボネート板で、こじ破りや打ち破りに抵抗する設計だね。",
    "ラミペーン / カラーラミペーン": "カタログでは、紫外線を99%以上カットする例も紹介されている。",
    "ソノグラス": "住宅用はJIS等級T-2、建築用はT-3をクリアする説明がある。",
    "テンパライト / ミストロンエース": "テンパライトは同じ呼び厚さのフロート板ガラスの約3.5倍、ミストロンエースは同じ呼び厚さの型板ガラスの約5.8倍の耐風圧強度と説明されている。",
    "ヒシワイヤ / クロスワイヤ / プロテックス": "ヒシワイヤとクロスワイヤは防火、プロテックスは飛散低減を主な目的としている。",
    "フロート板ガラス": "透明性と平滑性が特徴で、一般建築、店舗、ショーケース、家具など幅広い用途で使いやすい。",
    "すりガラス / 型ガラス": "目隠しと採光を両立しやすい。型ガラスは浴室や洗面所、すりガラスはやわらかく白くぼかしたい場所で見やすい。",
  };

  return performances[product.name] || product.performance[0];
}

function askFloat(question) {
  const trimmed = question.trim();
  if (!trimmed) return;

  createMessage({ author: "あなた", text: trimmed, own: true });
  input.value = "";

  window.setTimeout(() => {
    createTypingMessage({
      author: "フロート",
      text: getFloatReply(trimmed),
    });
  }, 420);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  askFloat(input.value);
});

quickActions.forEach((button) => {
  button.addEventListener("click", () => askFloat(button.dataset.question));
});

createMessage({
  author: "フロート",
  text: "俺はフロート。ガラスのこと、何でも聞いてね！",
  float: true,
});
