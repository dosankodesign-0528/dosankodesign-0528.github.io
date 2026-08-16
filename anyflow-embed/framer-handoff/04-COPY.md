# 04 コピー全文

> 実装から抜き出した**全テキスト**です。`01-LAYOUT.md` では60字で省略しているので、
> 長い本文はこちらから丸ごとコピーしてください。出現順に並んでいます。

> ⚠️ 「テキストが入ります。」はダミーです。**本番のコピーに差し替えてください。**

---

## 00 キービジュアル（8件）

1. `-`  
   ビジョン

2. `-`  
   提供できること

3. `-`  
   使用イメージ

4. `-`  
   導入事例

5. `cta`  
   お問い合わせ

6. `hl-eyebrow`  
   APIでデータを繋ぐプラットフォーム

7. `hl-line`  
   AIと事業を

8. `hl-line`  
   強くする

---

## 01 Our Vision（20件）

1. `vis-label rv`  
   Our Vision

2. `vl-in`  
   つなぐことが、

3. `vl-in`  
   強みになる時代へ。

4. `pf-title rv`  
   Platform

5. `pf-sub rv`  
   プラットフォーム

6. `pf-name rv`  
   コネクタ

7. `pf-name rv`  
   監査

8. `pf-name rv`  
   権限

9. `pf-name rv`  
   ワークフロー

10. `pf-name rv is-center`  
   認証基盤

11. `vh-s`  
   連携が生む、

12. `vh-l`  
   2つの価値

13. `vp-tag`  
   Point

14. `-`  
   01

15. `-`  
   賢いAIの土台をつくる

16. `-`  
   AIは、つながったデータの分だけ賢くなる。連携が、AIの燃料になる。

17. `vp-tag`  
   Point

18. `-`  
   02

19. `-`  
   業務実行の手足となる

20. `-`  
   AIは、つながったデータの分だけ賢くなる。連携が、AIの燃料になる。

---

## 02 実績（10件）

1. `res-head`  
   事業の推進力を、Anyflowが支えます。

2. `-`  
   導入企業

3. `-`  
   200+

4. `-`  
   連携実績

5. `-`  
   500+

6. `-`  
   稼働率

7. `-`  
   99.9%

8. `-`  
   最短リリース

9. `-`  
   1week

10. `res-text rv`  
   テキストが入ります。テキストが入ります。テキストが入ります。テキストが入ります。テキストが入ります。テキストが入ります。テキストが入ります。テキストが入ります。

---

## 03 開発者体験（146件）

> モックの中身（コード行・チャットの文言など）も全部入っています。

1. `dc-label`  
   Strength 01

2. `dc-one`  
   自動生成で開発スピードを加速

3. `dc-label`  
   Strength 02

4. `dc-one`  
   開発環境に柔軟に適応

5. `-`  
   anyflow — zsh

6. `kw`  
   $

7. `pl`  
   anyflow login --token

8. `st`  
   ••••••••

9. `ok`  
   ✔

10. `cm`  
   Authenticated as dosanko-design

11. `kw`  
   $

12. `pl`  
   anyflow flows create slack-to-kintone

13. `cm`  
   → resolving connectors...

14. `ok`  
   ✔

15. `cm`  
   Created flow

16. `id`  
   flw_8Xk2

17. `kw`  
   $

18. `pl`  
   anyflow deploy --prod

19. `cm`  
   → bundling  (12 files)

20. `cm`  
   → uploading (1.4 MB)

21. `ok`  
   ✔

22. `cm`  
   Deployed in

23. `id`  
   4.2s

24. `kw`  
   $

25. `pl`  
   anyflow logs --follow

26. `cm`  
   12:04:31  run

27. `ok`  
   succeeded

28. `kw`  
   import

29. `pl`  
   {

30. `id`  
   Anyflow

31. `pl`  
   }

32. `kw`  
   from

33. `st`  
   "@anyflow/sdk"

34. `pl`  
   ;

35. `kw`  
   const

36. `id`  
   client

37. `pl`  
   =

38. `kw`  
   new

39. `id`  
   Anyflow

40. `pl`  
   ({

41. `pl`  
   apiKey: process.env.

42. `id`  
   ANYFLOW_KEY

43. `pl`  
   ,

44. `pl`  
   });

45. `kw`  
   const

46. `id`  
   run

47. `pl`  
   =

48. `kw`  
   await

49. `id`  
   client

50. `pl`  
   .flows.

51. `id`  
   run

52. `pl`  
   (

53. `st`  
   "flw_8Xk2"

54. `pl`  
   , { input: { channel:

55. `st`  
   "#sales"

56. `pl`  
   } },

57. `pl`  
   );

58. `id`  
   console

59. `pl`  
   .log(

60. `id`  
   run

61. `pl`  
   .status);

62. `cm`  
   // "succeeded"

63. `id`  
   console

64. `pl`  
   .log(

65. `id`  
   run

66. `pl`  
   .records);

67. `cm`  
   // 3

68. `ttl`  
   SDK Reference

69. `-`  
   .run()

70. `k`  
   client.flows

71. `t`  
   Promise

72. `-`  
   .list()

73. `k`  
   client.flows

74. `t`  
   Flow[]

75. `-`  
   .list()

76. `k`  
   client.connectors

77. `t`  
   Connector[]

78. `-`  
   .exchange()

79. `k`  
   client.auth

80. `t`  
   Token

81. `-`  
   .verify()

82. `k`  
   client.webhooks

83. `t`  
   boolean

84. `-`  
   .watch()

85. `k`  
   client.runs

86. `t`  
   Stream

87. `kw`  
   import

88. `pl`  
   {

89. `id`  
   Anyflow

90. `pl`  
   }

91. `kw`  
   from

92. `st`  
   "@anyflow/sdk"

93. `pl`  
   ;

94. `cm`  
   // Slack の通知を kintone へ連携する

95. `kw`  
   const

96. `id`  
   flow

97. `pl`  
   =

98. `id`  
   anyflow

99. `pl`  
   .

100. `id`  
   createFlow

101. `pl`  
   ({

102. `pl`  
   name:

103. `st`  
   "slack-to-kintone"

104. `pl`  
   ,

105. `pl`  
   trigger:

106. `id`  
   slack

107. `pl`  
   .

108. `id`  
   onMessage

109. `pl`  
   (

110. `st`  
   "#sales"

111. `pl`  
   ),

112. `pl`  
   });

113. `id`  
   flow

114. `pl`  
   .

115. `id`  
   step

116. `pl`  
   (

117. `st`  
   "transform"

118. `pl`  
   , (msg) => ({

119. `pl`  
   title: msg.text,

120. `pl`  
   user:  msg.user.name,

121. `pl`  
   }));

122. `id`  
   flow

123. `pl`  
   .

124. `id`  
   step

125. `pl`  
   (

126. `st`  
   "create"

127. `pl`  
   ,

128. `id`  
   kintone

129. `pl`  
   .

130. `id`  
   addRecord

131. `pl`  
   );

132. `kw`  
   export

133. `kw`  
   default

134. `id`  
   flow

135. `pl`  
   ;

136. `ttl`  
   AI Assistant

137. `-`  
   Ask anything...

138. `-`  
   API

139. `-`  
   の場合

140. `-`  
   テキストが入ります。テキストが入ります。テキストが入ります。テキストが入ります。テキストが入ります。テキストが入ります。

141. `-`  
   CLI

142. `-`  
   の場合

143. `-`  
   テキストが入ります。テキストが入ります。テキストが入ります。テキストが入ります。テキストが入ります。テキストが入ります。

144. `-`  
   SDK

145. `-`  
   の場合

146. `-`  
   テキストが入ります。テキストが入ります。テキストが入ります。テキストが入ります。テキストが入ります。テキストが入ります。

---

## 04 導入事例（10件）

1. `case-title rv`  
   導入事例

2. `cc-quote`  
   1年で15種類の連携機能を提供！！外部データ連携のインフラとしてAnyflowを活用

3. `cc-tag`  
   HRテック

4. `cc-company`  
   株式会社SmartHR

5. `cc-quote`  
   CRMと自社プロダクトを相互連携。実物の連携画面で商談を推進！！

6. `cc-tag`  
   セールステック

7. `cc-company`  
   deex株式会社

8. `cc-quote`  
   単なるデジタル化でなく”真の営業DX”へ。100種以上のツール連携を推進中！！

9. `cc-tag`  
   セールステック

10. `cc-company`  
   SALES GO 株式会社

---
