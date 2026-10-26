# 競馬メモ app — desk research (facts only)

Research date: **2026-10-26 (JST)**. All prices/terms are as observed on that date. Japanese terms are kept verbatim where the wording matters. Nothing here is a product design; §6 lists what I could **not** verify.

---

## 0. Executive summary

1. **JRA publishes a lot for free, but no API.** 出馬表 (race card), オッズ, レース結果, 払戻金, 馬場情報, 競走馬データ are free HTML on `jra.go.jp`. No public API, no bulk download, no open-data licence.
2. **出馬表 comes in two stages:** Thursday ~16:00 without 枠番/馬番, then the day before the race at ~10:00 with 枠番/馬番. Some big races shift this (Friday 9:00 for 前日発売 GI, Saturday 10:00 for the Monday race of a 3-day meeting).
3. **JRA's own terms allow only private use / quotation.** Beyond that requires prior permission, and "申請は法人に限ります" (applications only from corporations). There is no explicit "no crawler" clause, but copyright + this clause cover redistribution.
4. **JRA-VAN (Data Lab) is the official paid data channel**, ¥2,090/月 tax-incl., Windows-only, delivered through an ActiveX COM component (`JV-Link`), ~40 years of data from 1986. Its 利用規約 第7条 permits **private personal use only**.
5. **The hard legal line for a multi-user web app:** JRA-VAN staff stated (2026-07-06) that serving Data Lab data to end users is 再配布 and needs JRA's commercial contract **「JRADB」**, which is **法人契約のみ / 個人不可**. A single-user personal tool is a different case from a service other people log into.
6. **netkeiba forbids scraping in practice and in its terms**: 第14条 limits use to 私的利用, 第15条 bans commercial use, and netkeiba explicitly says it applies "予告なく通信制限" to scrapers. It has **no public API**; only a news RSS feed.
7. **NAR (地方競馬)** data is on `keiba.go.jp` as HTML with query-string URLs (出馬表, 当日払戻金, データ検索). Terms: "事前の許諾なく転載、複製することを禁じます". JRA-VAN's JV-Data does include 地方競馬 and 海外国際レース record types.
8. **What a 競馬メモ actually holds** is well documented by practitioners: 印 (◎○▲△×☆), 買い目 by 券種 with 点数×金額, 投資額/払戻/回収率/的中率, and — crucially — **short qualitative per-horse notes about trouble in running** (出遅れ, コースロス, 不利, 力み, キックバック, ペース) plus a race-level rating.
9. **The market is crowded with small apps** (競馬メモ, umanote, 競馬ノート, 馬メモ, pakara, 馬券簿, 収支表…). Recurring complaints: ads, no data export/sync, manual entry tedium, and **sudden paywalling of historical totals** (one app's reviews are dominated by this).
10. **Domain edge cases are numerous and would break a naive schema**: 同着 changes which combinations pay; 枠連 refunds do _not_ happen on 同枠取消; field size is not always 18; 分割競走 today only happens when another race is cancelled.

---

## 1. Race data sources for JRA (中央競馬)

### 1.1 JRA official site (`jra.go.jp`)

**What is published free** (site navigation and pages observed 2026-10-26):

| Content | Free on JRA site | Notes |
| --- | --- | --- |
| 出馬表 (race card) | Yes | Two-stage publication, see timing below |
| オッズ (odds) | Yes | Win/place/quinella etc.; final odds also in 払戻 pages |
| レース結果 (results) | Yes | 着順, タイム, 上がり, 通過順, 馬体重 |
| 払戻金 (payouts) | Yes | Including 同着 and 返還 rules |
| 馬場情報 (track condition) | Yes | 含水率, クッション値 etc. |
| 競走馬検索 / データファイル | Yes | 成績, 血統, 騎手・調教師データ, レーティング |
| 開催日程 / 競馬番組 | Yes | 番組 PDF includes the actual rules |
| 調教タイム (training) | **Not found** | No 調教 menu item on the free site; 調教タイム is sold by netkeiba/競馬ブック (see §1.3). Flag: not exhaustively verified |
| 馬体重 | Yes, on race day | Announced on the day; appears in 出馬表/結果 |

**Publication timing of 出馬表** — JRA FAQ (primary):

> 「通常、出馬表は2段階に分けて発表されます。木曜日の16時すぎに、馬番号・枠番号を付けずに一旦発表されます。木曜日の発表以降に出走を取り消した馬を除いた出走馬に対して、レース前日の10時すぎに馬番号・枠番号が付された出馬表を発表します。」

Documented exceptions (same FAQ):

- GI / 一部重賞 with 前日発売: 枠番なし Thursday 16:00すぎ → 枠番あり **Friday 9:00すぎ**.
- 3日間開催 (Sat–Mon): the Monday 重賞's 枠番あり card is published **Saturday 10:00すぎ**.
- 有馬記念 / ホープフルステークス 2025 example: 12/25 14:00 枠番なし発表, 18:30 枠順（馬番）公開抽選.
- FAQ note: JRA's own site needs ~15 min after the announced time before the data is actually retrievable.

Source: <https://own.jra.jp/faq/pop02/2_2.html> (Shift_JIS page).

**Official API?** None found. No API documentation, developer portal, or bulk-download endpoint exists on `jra.go.jp`. The only official machine-oriented channels are (a) JRA-VAN, a JRA 100%-affiliated company, and (b) a commercial-use contract referred to as **JRADB** (see §1.2).

**Terms of use** (<https://www.jra.go.jp/use/>) — key clause:

> 「JRAが著作権を保有するコンテンツについて、著作権法上の「私的利用」や「引用」の範囲を超えて二次利用することを希望する場合は、事前に申請のうえ、JRAの許諾を得る必要があります。なお、**申請は法人に限ります。**」

Also: linking to the top page is allowed with the designated banner; deep links / links from "反社会的" sites may be refused. There is **no explicit crawler/robot clause** in `/use/` (flag: absence of a clause is not permission; copyright and the 私的利用 limit still apply).

**Useful primary artifact for domain rules:** JRA 競馬番組 general rules PDF, e.g. <https://www.jra.go.jp/keiba/program/2026/pdf/bangumi_ippan.pdf>. It contains 出走可能頭数 per venue/course/distance, 競走の分割, 同着 payout of prize money, 新馬競走 definition, etc. (§5 uses it).

### 1.2 JRA-VAN / Data Lab (`jra-van.jp`)

**Products and prices (税込, observed 2026-10-26)** — <https://jra-van.jp/buy/>:

| Product                            | Monthly    | 3 months | 12 months |
| ---------------------------------- | ---------- | -------- | --------- |
| JRA-VAN ネクスト (PC software)     | ¥880       | ¥2,640   | ¥10,560   |
| ネクスト + JRAレーシングビュアー   | ¥1,430     | ¥4,290   | ¥17,160   |
| **JRA-VAN データラボ**             | **¥2,090** | ¥6,270   | ¥25,080   |
| データラボ + JRAレーシングビュアー | ¥2,640     | ¥7,920   | ¥31,680   |
| JRAレーシングビュアー (option)     | ¥550       | ¥1,650   | ¥6,600    |

Smartphone app is included free with a subscription (otherwise iPhone ¥600 / Android ¥550).

**Data Lab specifics** (<https://jra-van.jp/dlb/index.html>):

- **Windows PC only** ("Windowsパソコン向けサービスです。スマートフォンではお使いいただけません").
- Requires the base software **`JV-Link`** (an ActiveX COM component) plus a 利用キー.
- **1986年から約40年分** of official data; daily updates; real-time odds.
- Bundles **TARGET frontier JV** (the most-used analysis software in this ecosystem).
- "ソフト開発者向け" SDK/sample code: <https://jra-van.jp/dlb/sdv/>.

**Licence — JRA-VAN 利用規約 第7条（情報の利用範囲）** (<https://jra-van.jp/info/rule.html>):

> 「お客様は、本人が自ら個人として私的に使用する以外に、本サービスを通じて入手した一切の情報等を、複製、改変、翻案、放送、有線送信、インターネット、編集、出版、上映、演奏、頒布、販売するなどいかなる方法によっても、使用したり公表したりすることができません。」「2 お客様は、第三者をして、…営利を目的とするか否かを問わず…使用させたり、公表させたりすることはできません。」「3 前2項にかかわらず、JRA-VAN登録ソフトのソフト紹介を目的とした場合など、当社が認めた場合はこの限りではありません。」

**The redistribution line, stated officially (2026-07-06)** — JRA-VAN staff post <https://developer.jra-van.jp/t/topic/899>:

> 「JRA-VAN DataLab.（JV-Link）のデータを使用し、エンドユーザーへデータを提供するようなスマホアプリ制作や商用利用は、利用規約「第7条（情報の利用範囲）」におけるデータの再配布（二次利用）にあたるため、DataLab.の通常契約のみでは行うことができません。」→ such use requires JRA's 商業利用契約 **「JRADB」**; **対象：法人契約のみ**; **個人のお客様によるご契約はできません**; fees are not disclosed ("料金や体系についてもお答えいたしかねます").

**Practical/technical constraints reported by the developer community** (secondary but concrete):

- JV-Link is 32-bit COM; Windows-only; Windows Server is not supported (community/Zenn notes). <https://zenn.dev/miyagiy/scraps/2d125bcd85f5da>
- JV-Data record types include `RA` (レース詳細) and `SE` (馬毎レース情報), with データ区分 A=地方競馬, B=海外国際レース, and fields such as 同着区分 / 同着頭数 / コーナー順位 / 後3ハロンタイム / 馬体重 / 増減符号. <https://developer.jra-van.jp/t/topic/61>
- Active OSS around it: `miyamamoto/jrvltsql` (★26, pushed 2026-10-13), `urasandesu/JVLinkToSQLite` (★16, 2026-08-30).

### 1.3 netkeiba.com

**Terms** (<https://www.netkeiba.com/info/kiyaku.html>) — the operative clauses:

- 第14条（私的利用の範囲外の利用禁止）: 「サービスを通じて入手した いかなるデータ、情報、文章…も、著作権法で認められた私的利用の範囲を超える複製、販売、出版のために利用することはできません。」「データ等を不特定または多数の者が知りうる状態におく行為は、いかなる目的であっても私的利用の範囲を超える利用行為とみなします。」
- 第15条（営業活動の禁止）: commercial use and preparation for it are prohibited without approval.
- 第16条(12): unauthorised access / interfering with operation is prohibited.

**Scraping — netkeiba's own support article** (<https://support.keiba.netkeiba.com/hc/ja/articles/39720493823129>):

> 「スクレイピングによって多数のリクエスト（アクセス）を確認し、弊社サービスに対して支障があると判断した場合は、予告なく通信制限をかけさせていただくことがございます。その場合、解除のご依頼をいただきましても解除できかねます。」根拠として第16条(15)(16)を挙げ、「スクレイピングはご自身の責任で、上記利用規約に抵触しないかを確認をお願いいたします」。

**Public API:** none. The only machine-readable feed is a **news/column RSS**: `https://rss.netkeiba.com/?pid=rss_netkeiba&site=netkeiba` (linked from <https://www.netkeiba.com/?pid=rss>). It carries headlines, not race data.

**Secondary-use guide** (<https://info.netkeiba.com/?pid=secondary_guide>) — screenshots are allowed on personal blogs/videos _with conditions_, and these are explicitly **not** reusable even as screenshots:

- レース映像・調教映像, ウマい馬券の予想家の予想内容（印・中身）, 外部提供ニュース, コラム, 競馬新聞, **調教タイム（出走表内・データベース内）**, 厩舎コメント, パドック速報, ユーザー投稿写真, 掲示板の投稿, マイページの投稿.
- Paid-member content must not be in the screenshot (log out first).

**Paid tiers & timing facts:** プレミアム / スーパープレミアム exist; prices were revised on **2024-10-15** (the price table is published as an image, so exact figures were not machine-readable — flag). 「想定出馬表」 is published **Wednesday ~16:00** (moved from 20:00 on 2024-09-25) for premium users; パドック速報/全レースパドック映像 are スーパープレミアム; 地方競馬AI予想オッズ is free for everyone (from 2024-09-24). Source: <https://dir.netkeiba.com/info_price_change/>.

### 1.4 Other Japanese outlets

| Source | What is free | Structured data / API | Verified? |
| --- | --- | --- | --- |
| スポーツナビ (Yahoo!) | 出馬表, オッズ, 結果 (HTML) | No public API documented; tested RSS path `sports.yahoo.co.jp/rss/keiba` returned **404** | Partly (RSS negative) |
| 競馬ブック (`keibabook.co.jp`) | 用語辞典, 一部ニュース; `p.keibabook.co.jp` is a paid DB | No API; paid DB subscription | Partly |
| 日刊スポーツ (keiba section) | News HTML | No API known | Not verified |
| UMATOKU | Media/columns | No API known | Not verified (operator not confirmed) |
| 楽天競馬 | NAR betting site: 出馬表/オッズ/結果 | No public API known | Not verified |
| グリーンチャンネル | TV listings / 番組情報 | No data API known | Not verified |

There is no evidence of any free, licensed, JSON race-data endpoint from any of these. Treat "free structured data" as **not available** from Japanese racing media; the realistic free options are HTML pages and RSS headlines.

### 1.5 Third-party / unofficial / open data

- **GitHub scrapers**: numerous netkeiba scrapers exist but are small and stale — e.g. `cyouzetu/netkeiba` (pushed 2024-01), `wdy06/netkeiba_scraper` (2021), `ussiik1/netkeiba-scraper` (2021), all ★0. JRA-VAN wrappers are healthier (`jrvltsql` ★26, `JVLinkToSQLite` ★16). Search run via GitHub API on 2026-10-26.
- **Legality of scraping netkeiba**: the terms (§1.3) restrict use to 私的利用 and prohibit putting data in a state where "不特定または多数の者が知りうる". Automated collection that burdens the service is treated as a 禁止行為 and met with IP-level throttling. A public web app populated by scraping netkeiba would therefore be at odds with both 第14条 and 第15条. I found **no court ruling** on Japanese horse-racing scraping — flag as untested legally.
- **Kaggle / open datasets**: not verified in this session (no reliable check performed — see §6). Anecdotally such datasets exist, but their provenance is usually scraped netkeiba/JRA data, which does not cure the licence problem.

---

## 2. NAR (地方競馬) and overseas races

### 2.1 NAR official

- Site: **地方競馬情報サイト** <https://www.keiba.go.jp/>. Operated by the 主催者 and 地方競馬全国協会 (NAR).
- Free content includes 本日のレース情報, 出馬表, 当日メニュー, **当日払戻金**, 開催日程, データ検索, ライブ中継.
- **Stable query-string URL pattern** (verified live): `https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/DebaTable?k_raceDate=2026%2F10%2F28&k_raceNo=7&k_babaCode=27` — i.e. date + race number + 場コード (`27` = 園田, `20` = 大井, `24` = 名古屋).
- **Terms** (<https://www.keiba.go.jp/terms.html>): 「当サイトで使用している画像及びテキスト等の掲載情報についての全ての権利は、原則として主催者等に帰属します。**事前の許諾なく転載、複製することを禁じます。**」 Also: 「特定のIPアドレスから当サイトに対し、異常な件数のアクセスまたは不正なアクセスが確認された場合、該当のIPアドレスから当サイトへのアクセスを遮断することがあります。」
- netkeiba also runs a NAR section (`nar.netkeiba.com`) under the same netkeiba terms.

### 2.2 NAR/overseas inside JRA-VAN

JV-Data covers both, per the official spec Q&A (<https://developer.jra-van.jp/t/topic/61>):

- `RA`/`SE` **データ区分 A = 地方競馬**, **B = 海外国際レース** (B1 日本馬, B2 外国馬).
- Fields populated for these include 競走種別/重量種別, 同着区分・同着頭数, 1〜4コーナー順位, 後3ハロンタイム, タイム差, 馬体重・増減, 騎手/調教師 codes.
- Caveat from the same thread: the spec had some fields documented as "初期値" that are actually populated for A/B records; the spec PDF was corrected on 2024-08-07. So don't trust field-level defaults blindly.

### 2.3 Overseas races sold by JRA

- Page: **海外競馬発売** <https://www.jra.go.jp/keiba/overseas/>. It publishes 発売レース・主要レース一覧, **発売レース結果検索（結果・最終オッズ・票数）**, 発売のルール, 発売時間, 海外競馬英和辞典, 日本馬海外遠征の記録.
- Sales channel restriction: 「A-PAT・JRAダイレクト・プッシュホン投票では発売しません」「競馬場やウインズ等では発売しません（UMACA・UMACAスマートでは発売しません）」 — i.e. **JRA・海外ネット投票 only**.
- Consequence for a memo app: an overseas JRA-sold race has JRA-style 払戻 and オッズ, but the race is not part of a Japanese 開催 and its data model (foreign 馬番, 枠なし, different 着順/取消 semantics) differs. Flag: I did not enumerate which races are sold in 2026.

---

## 3. What a 競馬メモ contains in practice

### 3.1 Three documented real formats

**(a) 岡本レースメモ — a professional tipster's per-horse memo (東スポ競馬, PDF)** Source: <https://tospo-keiba.jp/files/shares/岡本レースメモ関連/岡本レースメモ説明書.pdf> (URL-encoded; 9 pages, text-extracted).

Its stated policy is the most useful fact for anyone modelling a memo:

> 「（１）レース映像を見なければ分からないことについてのみ記す →通過順位、上がりタイム、着順など、馬柱を見れば分かることには触れない。」「（２）マイナス要素があったときのみ記す →…「メモが存在しない＝特段マイナス要素は認められなかった」ということ。」「（３）１週間の間で映像分析に使える約３０時間でできる範囲のことをやる」

Its controlled vocabulary (all defined in 0.1–0.5 second loss bands):

- **スタート関連**: 出遅れ / やや大きな出遅れ / 大出遅れ / つまずく / ヨレる / 好スタート / ロケットスタート…
- **コースロス関連**: 外を回るロス / かなり外を回るロス / 大きく外を回るロス / 伸びないところを通った…
- **不利関連**: ～で少し不利 / ～で不利 / ～で大きな不利 / 直線でさばけず / 追い出しを待たされた; plus outcome tags 「もう少しやれた」「もっとやれた」「○着もあった」
- **力み関連**: 力んでいた / 力みが目立った / かなり力んでいた / 猛烈に力んでいた
- **キックバック関連**: キックバックを嫌がっていた（0.2–0.6秒の短縮が見込める）… 泥のキックバック…
- **ペース関連**: ハイペースで仕方なしの結果 / スローのなか後方からで大敗も仕方なし / 展開に恵まれた面もある / ハイペースからよく頑張った
- **その他**: 余力あり / 走法的に～向き / 将来性
- **レースレベル**: one number in class units ("1クラス分の差を1.0として扱う"), e.g. 「+0.5」「+3.0」, judged on the winner and the race time in that 馬場.

**(b) 横けん — TARGET frontier JV as an "external brain" (practitioner blog)** Source: <https://yokokenkeiba.com/target-memo-database/>

He repurposes TARGET's custom columns:

- **R印3**: which lane/position was advantaged in that race, encoded as two digits (e.g. `12` = 1列目が最も有利, 2列目が2番目).
- **KOLメモ**: free-text qualitative note, with bracketed tags **【許容できる負け】** (lost to trip/trouble → forgive) and **【時計以上の評価】** (slow time, strong content).
- **結果C**: whether the trip suited the horse (展開の恩恵).
- **予想C**: a 9-level pre-odds ranking, A2–B2 = 本命候補, C1–C2 = 相手/ヒモ, D1–E1 = **消し**.
- Stated principle: 「「記憶」という不確かなものを捨て、「記録」というシステムに頼っている」.

**(c) 長さんの競馬ノート — a public 競馬ノート site** Source: <https://keiba-note.cyou/about>

- 印 are only **◎（本命）・○（対抗）・▲（単穴）**, with weaker picks shown in parentheses/grey.
- Race-level indicators: **荒れ指数** (4 levels), **注目馬・危険馬**, **脚質分布**（逃げ・先行・差し・追込）, **ファクター重要度**（人気・脚質・血統・枠番）.
- Per-horse drill-down: 「AI がまとめた**買い材料・消し材料**」.
- Post-race: 結果（着順と印を並べる）, 着差, コーナーの位置取り, **このレースの印成績**; yearly **印別の着順分布・複勝率・単勝/複勝の回収率**.
- Note: 競走中止 horses are excluded from 推奨馬の成績.

### 3.2 Vocabulary and fields actually used

**印 (marks)** — conventions vary by publisher/app; the common core:

| 印       | Reading     | Meaning                                      |
| -------- | ----------- | -------------------------------------------- |
| ◎        | 本命        | top pick (most likely winner)                |
| ○        | 対抗        | main rival                                   |
| ▲        | 単穴        | third pick, "could win on best form"         |
| △        | 連下 / 穴   | horses that can fill 2nd–3rd (often several) |
| ☆        | 穴 / 注意   | longshot worth including; or "next-best"     |
| ×        | 消し / 軽視 | opposed — will not buy                       |
| 注       | 注          | caution/interesting but not a main pick      |
| 消       | 消し        | explicitly excluded                          |
| チェック | —           | flagged for later                            |

Evidence that the set is not standardised: the iOS app 競馬ノート offers **8 kinds**「◎ ○ ▲ △ 星 チェック 注 消」; the Android app 馬メモ offers **11 kinds**; 長さんの競馬ノート uses only 3 (+ greyed auxiliaries). So any schema must treat 印 as a configurable label set, not an enum of 6.

Related terms:

- **軸馬** — the horse a bet is built around (single 軸 in 3連単/3連複, or 2頭軸).
- **穴馬** — high-odds contender; **連下** — horses that can finish 2nd/3rd; **消し** — deliberately not bought.
- **本命/対抗/単穴** are ordinal labels; **穴/連下** are role labels. They overlap in practice.

**券種 (bet types)** — official JRA list (JRA 馬券の種類 page, <https://www.jra.go.jp/kouza/baken/>):

| 券種 | Pick | Order matters | Notes |
| --- | --- | --- | --- |
| 単勝 | 1頭 | — | 1着 |
| 複勝 | 1頭 | — | 2着まで (5–7頭) / 3着まで (8頭以上) |
| 応援馬券 | 1頭 | — | 単勝＋複勝 set |
| 枠連 | 2枠 | No | 枠番; not sold under 8頭 unless 同枠2頭以上 |
| 馬連 | 2頭 | No | 1–2着 |
| 馬単 | 2頭 | **Yes** | 1→2着; 裏 (reverse) is a separate bet |
| ワイド | 2頭 | No | 3着まで; 3着同士の組は不的中 |
| 3連複 | 3頭 | No | 1–3着 |
| 3連単 | 3頭 | **Yes** | 1→2→3着 |
| WIN5 | 5 races | — | 5 races' 1着; carryover if no hit |

**How bets get recorded** (from app descriptions and practitioner posts):

- Per race: 券種, 買い目 (the actual combination, e.g. 「3連単 1→5→10」), **点数** (number of combinations), **1点あたり金額**, **投資額 = 点数 × 金額**, **払戻額**, 的中/不的中.
- Multi-race: 1レース投資額, 1日投資額, 月間投資額; **回収率 = 払戻 ÷ 投資 × 100**, **的中率 = 的中レース数 ÷ 購入レース数**.
- Aggregations seen in real apps: 券種別, 印別 (勝率・連対率・複勝率), 競馬場別, グレード別, 期間別, 人気帯別, 時間帯別 (午前/午後), レース格別 (G1/重賞/平場).
- **WIN5** is usually a separate record type (組み合わせ・点数・払戻) because it spans 5 races and has carryover.

**資金管理 terms**: 1レース投資額, 資金, 月間収支, 年間収支, 生涯収支, 最大益/最大損, 回収率, 的中率. The 競馬ノート app's dashboard is a good field inventory: 収支サマリ（生涯・年間・月間）, 収支推移チャート, 印別勝率/連対率/複勝率, 馬券種別の傾向・的中率・回収率, 最高益/最大損レース.

**予想の要素 (handicapping factors)** — the set named by JRA-VAN's bundled TARGET and by 馬メモ: 血統, 調教, 前走, ラップ/上がり3F, 展開, 馬場, 枠, 騎手, ハンデ (斤量), 距離適性, コース替わり, 脚質. Practically they split into:

- _computable from data_: 前走着順/着差, 上がり3F, 通過順, 馬体重増減, 枠, 斤量, 騎手, 距離/コース, クラス, 休み明け間隔.
- _human judgement_: 展開予測, 馬場の内外有利, 調教の良し悪し, 気性/力み, 不利の度合い.

### 3.3 振り返りの書き方 (how retrospectives are actually written)

Observed patterns, all from the sources above:

1. **Negative-only, loss-quantified** (岡本): each note implies "how much time/position was lost" in 0.1–0.5s bands, and whether the horse would have finished better (「○着もあった」). No note = no excuse.
2. **Forgiveness tags** (横けん): 【許容できる負け】= the defeat is excusable and the horse stays on the 狙い馬 list; 【時計以上の評価】= the bare time undersells the performance.
3. **Trip-advantage encoding** (横けん `R印3`) and **race-level figure** (岡本 `±0.0` in class units) separate "the horse" from "the race shape".
4. **Self-scoring** (競馬ノート app's 自己評価 field): a per-race self-grade so that 予想力 is tracked separately from 収支.
5. **Retrieval by horse** is the stated purpose: 横けん explicitly says a note written once is recalled "0.1秒で" when the horse runs again six months later. 長さんの競馬ノート keeps 印成績 per race and per year.

---

## 4. Existing apps / tools for 競馬メモ・予想管理・収支管理

Verified through the iTunes Search/Lookup API and Google Play on 2026-10-26 (ratings are App Store JP, count in parentheses).

| Name | Platform | Price | What it does | Notes / complaints |
| --- | --- | --- | --- | --- |
| **競馬メモ** (Masaya Kato) | iOS | Free (ads) | Records 購入額/払戻額/レース/馬券種類/競馬場/自己評価/メモ/画像; auto 回収率・的中率; 月間/年間; 券種別集計; search | 4.3 (696). Reviews: ads ("有料版を出してほしい"), no device migration/sync, dark-mode text invisible, "やり方がむずかしい", cannot tag 芝/ダート/クラス, race names not pre-filled |
| **umanote - 競馬のメモ帳** | iOS | Free | Rich-text notebook; separate 予想/回顧 notes; per-race and per-horse notes; favourite horses; horse tags (「逃げ」「差し」「前走不利」) | 4.7 (81). 中央競馬 only, and only from **2024-01** onwards |
| **競馬ノート - 馬券収支と予想を簡単記録** | iOS | **¥500 one-time** | 8 印, My馬券 presets, WIN5, calendar, dashboard (回収率/的中率 by 券種, 印別勝率・連対率・複勝率), search by grade/venue/印/period; **local storage only, no account** | 4.5 (11). Explicitly "サブスクなし・広告なし・追加課金なし"; supports 中央/地方/海外 |
| **馬メモ -JRA公式サイト対応競馬メモ-** | Android | Free (ads) | **Paste a JRA race-page URL to import race + horse names**; free-form 予想ファクター scoring (タイム/展開/枠順/騎手/血統/調教); 11 印; per-horse registry; Android backup | 50+ installs, updated 2026-10-04. Shows that "paste JRA URL" import is an existing, shipping pattern |
| **競馬収支管理アプリ** (Taro Horiguchi) | iOS | Free → subscription | 収支/回収率 calendar, reports | 4.5 (2,133) but recent 1★ reviews are almost all about a **sudden paywall**: free now limited to 30 days / current+last month; "告知無しに課金制", "年間収支が見れない", many "他アプリに変えます" |
| **pakara 競馬の予想、投票と収支管理** | iOS | Free | 予想・投票・収支 | 4.5 (1,926) |
| **競馬収支を自動で管理 馬券簿** | iOS | Free | 収支/回収率 | 4.3 (2,267) |
| **競馬収支を管理 収支表アプリ** | iOS | Free | 収支表 | 4.8 (2,133) |
| **馬卓〜競馬収支日記** | iOS | Free | 収支日記 | 3.7 (35) |
| **競馬手帳 - 馬券の収支と回収率の記録** | iOS | Free | 収支/回収率 | Exists but 0 ratings — effectively dormant |
| **競馬×印メモ うまぴっと** | iOS | Free | 予想記録＋共有 | 5.0 (1) |
| **TARGET frontier JV** | Windows | Bundled with Data Lab ¥2,090/月 | Full 出馬表/成績 DB, ~100 analysis cuts, custom 馬印 columns, 備考欄, 買い目, 収支 | De facto standard for heavy users; constraints: Windows only, JRA-VAN contract required, data cannot be redistributed (第7条) |
| **netkeiba 予想 / マイページ / メモ** | Web/iOS/Android | Free account; プレミアム paid | 印・買い目 per race, お気に入り馬, **メモ** (`race.netkeiba.com/notes/schedule.html`), 俺プロ (public predictions), 集計 | Free tier limited; プロ予想/想定出馬表/パドック are paid; terms forbid reuse of 予想家の印. Which tier unlocks メモ is **not verified** |
| **Spreadsheet (Excel/Google Sheets)** | Any | Free/paid | Fully manual: 日付, 場, R, 券種, 買い目, 点数, 金額, 払戻, メモ | Frequently recommended in blogs; **no authoritative source found** (flag) |
| 競馬の羅針盤 / 的中倶楽部 | ? | ? | — | **Not verified** — no product page found (see §6) |

**Complaint themes that recur** (from reviews and blog posts):

1. **Ads** and requests for a paid/ad-free tier.
2. **No sync / no export / data lost on device change** ("スマホ買い替えたらデータ引き継げないのかな").
3. **Sudden monetisation of history** — limiting free users to 30 days of totals destroys the core use case (long-run 回収率), and triggers 1★ migration away.
4. **Manual entry burden** — no auto-import of race/horses; several reviews ask for pre-filled race names or class/surface tags.
5. **Analysis too shallow** — cannot slice by 芝/ダート, class (新馬/未勝利/1勝), which users explicitly ask for.
6. **Windows-only / steep learning curve** for TARGET-class tools.

---

## 5. Domain edge cases a naive model gets wrong

| # | Term | Fact (1–2 lines) |
| --- | --- | --- |
| 1 | **開催 (meeting)** | A venue's race meeting is identified by 回次 + 競馬場 (e.g. 第4回東京競馬) and runs 2 days (Sat–Sun) or 3 days (Sat–Mon holidays); the same venue can host multiple 開催 per year, so "Tokyo" alone is not a key. |
| 2 | **1日12レース** | JRA caps a day at 12 races — the 番組 rules say splitting is done 「1日の競走数が12を超えない範囲内において」, and allowances reference 第10〜第12競走. Race numbers can be re-numbered when a race is cancelled or split. |
| 3 | **枠番 vs 馬番** | 枠番 is the 1–8 bracket (colour-coded, used by 枠連); 馬番 is the individual horse number (up to 18). They are different keys and 枠連 pays on 枠番. |
| 4 | **Field size is not fixed** | 出走可能頭数 varies **12–18** by venue/course/distance (e.g. 新潟 芝1000m直線 Aコース = 18, most ダート = 12–16, 障害 = 14). Never hard-code 18. |
| 5 | **同着 (dead heat)** | Not "two winners": JRA treats one as 1着, one as 2着, one as 3着 — so 1着同着 still yields a 2着 and 3着. 3着同着 makes 3着どうしの組合せ (ワイド, 3連複, 3連単) **不的中**, and payouts use rates different from the published final odds. |
| 6 | **降着 (demotion)** | If interference is found and the victim would have finished ahead, the offender is placed **behind the victim** (not last), so placings shift by one or more positions. |
| 7 | **失格 (disqualification)** | For "極めて悪質" dangerous riding causing major disruption — the horse loses its placing entirely. Note: a victim that falls or stops does **not** automatically disqualify the offender. |
| 8 | **出走取消 vs 競走除外** | 出走取消 = withdrawn **before** entering the 装鞍所 (illness/injury); 競走除外 = withdrawn **after** 装鞍所, before the start. Different labels, same refund treatment, different timing. |
| 9 | **競走中止 (DNF)** | Horse starts but does not finish (fall, injury, pulled up). It has no finishing position, and is often excluded from 印/推奨馬 statistics (e.g. 長さんの競馬ノート excludes them explicitly). |
| 10 | **返還 (refund)** | Bets containing a scratched horse are refunded: 単勝/複勝 the horse's tickets; 馬連〜3連単 all combinations containing it. **枠連 is the exception — 同枠取消しは返還となりません** (the bracket still runs with the remaining horse). Refunds can be 全返還 or 一部返還. |
| 11 | **分割競走 (split race)** | Current JRA rule: only when a race is **cancelled** and a 平地一般競走 has **≥16 applicants** — then it is split into A/B (odd/even 仮番号) within the 12-race cap. It is _not_ "any race with too many entries", and not specifically a 新馬 thing today. |
| 12 | **2歳新馬 (maiden newcomer)** | 新馬競走 = a race for horses that have **never started** in any race (including 地方/外国). It is a class, not an age group — 3歳未出走 also runs in 新馬. |
| 13 | **障害戦 (jump race)** | Max 14 runners, different course/distance set, fall/unseat is common, and times are not comparable with 平地 — 持ち時計 and 上がり comparisons must be scoped to 障害. |
| 14 | **持ち時計 (best time)** | A horse's best time at a given distance; 競馬ブック's dictionary warns it is **not** a direct ability measure because 馬場状態, コース and number of attempts differ. |
| 15 | **同枠** | Two or more horses in the same 枠. 枠連 can be sold even with ≤8 runners if a 枠 holds 2+ horses; a 同枠取消 does not trigger a refund. |
| 16 | **複勝 with multiple payouts** | 複勝 pays 2 places with 5–7 runners and 3 places with 8+; with 同着 there can be more than three paying combinations, and each paying combination has its own payout rate. |
| 17 | **No winner (的中者なし)** | For all pools except WIN5, a 70%-payout pool returns ¥70 per ¥100 and an 80% pool ¥80; WIN5 carries over to the next week. |
| 18 | **払戻期限** | Winning and refund tickets are payable for **60 days**; JRA-UMACA refunds are auto-charged with a 5-year balance validity. |
| 19 | **Race-day 馬体重** | Announced on race day (not in the Thursday card); recorded with a ± sign and increment, and absent for scratched horses — so a memo schema needs "unknown/not announced" states. |
| 20 | **Weather/馬場 changes and 中止・延期** | 開催中止 or 競走取りやめ changes 返還 scope (全返還 vs 一部返還) and can re-number races; 延期 re-opens 出馬投票. |

---

## 6. Could NOT verify (explicit flags)

1. **JRADB** — referenced only by JRA-VAN staff (2026-07-06). I found **no public JRA page** describing JRADB, its price, or its contract terms. Treat "JRADB exists and is corporate-only" as _reported by JRA-VAN_, not independently confirmed.
2. **Exact netkeiba premium prices** — the 2024-10-15 price table is published as an image (`price_browser.jpg`), so figures could not be extracted. Only the date and the tier names are verified.
3. **Whether JRA publishes 調教タイム anywhere free** — I found no 調教 entry in the free-site navigation and netkeiba treats 調教タイム as non-reusable paid content, but I did not exhaustively crawl JRA race pages. Do not assert "JRA never publishes 調教" without a second check.
4. **Kaggle / open datasets** — not checked in this session; no dataset was verified for provenance or licence.
5. **競馬の羅針盤 / 的中倶楽部** — searches returned no product page or app listing. They may be individual tipster sites, renamed, or defunct. **Unverified.**
6. **スポーツナビ / 日刊スポーツ / UMATOKU / 楽天競馬 / グリーンチャンネル** — only spot-checked (sportsnavi RSS path 404). Their terms and any hidden JSON endpoints were **not** reviewed. Do not assume they permit reuse.
7. **Legal precedent** — no court decision on scraping Japanese racing sites was found; the analysis in §1.3/§1.5 is terms-based, not litigation-based.
8. **NAR per-venue differences** — NAR is 14+ separate 主催者 with local rules (e.g. ばんえい, 盛岡/水沢); I verified only the shared portal and terms, not per-venue data semantics.
9. **JRA field-size specifics** — I read 出走可能頭数 for 札幌/函館/福島/新潟 only; other venues' tables exist in the same PDF (p.9–12) but were not transcribed.

---

## Sources

**JRA (primary)**

- 出馬表の発表日時 FAQ — <https://own.jra.jp/faq/pop02/2_2.html>
- ご利用に際して（著作権・二次利用） — <https://www.jra.go.jp/use/>
- 馬券の種類・発売/払戻（同着・返還・払戻率） — <https://www.jra.go.jp/kouza/baken/>
- 降着・失格のルール解説 — <https://www.jra.go.jp/judge/>
- 出走取消・競走除外の意味 FAQ — <https://jra.jp/faq/pop02/2_7.html>
- 取消・除外馬を含む馬券の返還 FAQ — <https://jra.jp/faq/pop04/5_16.html>
- 返還金の扱い FAQ — <https://jra.jp/faq/pop04/5_17.html>
- 競馬番組 一般事項 PDF（2026） — <https://www.jra.go.jp/keiba/program/2026/pdf/bangumi_ippan.pdf>
- 海外競馬発売 — <https://www.jra.go.jp/keiba/overseas/>

**JRA-VAN**

- 製品ラインナップ／購入申込（価格） — <https://jra-van.jp/buy/>
- JRA-VAN データラボ（Windows / JV-Link / 1986年〜） — <https://jra-van.jp/dlb/index.html>
- ソフト開発者向け — <https://jra-van.jp/dlb/sdv/>
- JRA-VAN 利用規約（第7条） — <https://jra-van.jp/info/rule.html>
- 競馬データの商用利用のお問い合わせについて（JRADB, 2026-07-06） — <https://developer.jra-van.jp/t/topic/899>
- RA/SE の地方競馬・海外国際レース情報について — <https://developer.jra-van.jp/t/topic/61>
- 地方競馬データの配信ポリシーについて — <https://developer.jra-van.jp/t/topic/677>

**netkeiba**

- 利用規約 — <https://www.netkeiba.com/info/kiyaku.html>
- スクレイピングと通信制限（サポート） — <https://support.keiba.netkeiba.com/hc/ja/articles/39720493823129>
- 二次利用ガイド（利用不可コンテンツ） — <https://info.netkeiba.com/?pid=secondary_guide>
- プレミアム価格改定・想定出馬表16時化（2024-09-12） — <https://dir.netkeiba.com/info_price_change/>
- RSS — <https://www.netkeiba.com/?pid=rss> / feed: <https://rss.netkeiba.com/?pid=rss_netkeiba&site=netkeiba>

**NAR**

- 地方競馬情報サイト — <https://www.keiba.go.jp/>
- 出馬表（URLパターン例） — <https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/DebaTable?k_raceDate=2026%2F10%2F28&k_raceNo=7&k_babaCode=27>
- 利用規約（転載・複製の禁止） — <https://www.keiba.go.jp/terms.html>

**Practice / 競馬メモ**

- 岡本レースメモ説明書（東スポ競馬, PDF） — <https://tospo-keiba.jp/files/shares/%E5%B2%A1%E6%9C%AC%E3%83%AC%E3%83%BC%E3%82%B9%E3%83%A1%E3%83%A2%E9%96%A2%E9%80%A3/%E5%B2%A1%E6%9C%AC%E3%83%AC%E3%83%BC%E3%82%B9%E3%83%A1%E3%83%A2%E8%AA%AC%E6%98%8E%E6%9B%B8.pdf>
- TARGET 備考欄を「外部脳」にする（横けん競馬） — <https://yokokenkeiba.com/target-memo-database/>
- 長さんの競馬ノート（印・指標の定義） — <https://keiba-note.cyou/about>
- 競馬ブック 用語辞典「持ちタイム」 — <https://cdn.keibabook.co.jp/dictionary/mo/mo_003.html>
- JV-Link 開発の実務メモ（Zenn） — <https://zenn.dev/miyagiy/scraps/2d125bcd85f5da>

**Apps**

- 競馬メモ（App Store） — <https://apps.apple.com/jp/app/id1449455080>
- umanote — <https://apps.apple.com/jp/app/id6739488670>
- 競馬ノート — <https://apps.apple.com/jp/app/id6748079640>
- 競馬収支管理アプリ — <https://apps.apple.com/jp/app/id1559289324>
- 馬メモ（Google Play） — <https://play.google.com/store/apps/details?id=com.yumemarustudio.umamemo>
- iTunes Search API（アプリ一覧・価格・評価の取得元） — <https://itunes.apple.com/search>

**Code / data**

- GitHub search: `jrvltsql` — <https://github.com/miyamamoto/jrvltsql>
- GitHub search: `JVLinkToSQLite` — <https://github.com/urasandesu/JVLinkToSQLite>
