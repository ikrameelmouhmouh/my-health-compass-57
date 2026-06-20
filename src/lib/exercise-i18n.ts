// Translations for the 26 featured exercises (name + step-by-step guide).
// Six languages: English, Dutch, Arabic, French, German, Spanish.
// Looked up by exercise id via `useExerciseT()`.

import { useI18n } from "@/lib/i18n";
import type { Language } from "@/lib/i18n";

type Entry = { name: string; steps: string[] };
type Pack = Record<string, Entry>;

const en: Pack = {
  "wide-leg-press": {
    name: "Wide Leg Press",
    steps: [
      "Sit in the machine with your feet placed wide on the platform.",
      "Press the platform away until your legs are almost straight (knees slightly bent).",
      "Lower the weight slowly until your knees bend to about 90°.",
      "Keep your back against the pad and squeeze your quads.",
    ],
  },
  "barbell-squat": {
    name: "Barbell Back Squat",
    steps: [
      "Place the barbell on your upper back, feet about shoulder-width apart.",
      "Squat down under control until your thighs are parallel to the floor.",
      "Drive through your heels back up to the start.",
    ],
  },
  "romanian-deadlift": {
    name: "Romanian Deadlift",
    steps: [
      "Hold the barbell in front of your thighs with a slight bend in your knees.",
      "Hinge forward from your hips, keeping your back flat.",
      "Feel the stretch in your hamstrings, then drive your hips forward to stand up.",
    ],
  },
  "leg-extension": {
    name: "Leg Extension",
    steps: [
      "Adjust the machine so your knees line up with the pivot point.",
      "Extend your legs fully and squeeze your quads for one second at the top.",
      "Lower the weight under control.",
    ],
  },
  "lying-leg-curl": {
    name: "Lying Leg Curl",
    steps: [
      "Lie face down with your heels under the roller.",
      "Bend your knees to bring the roller toward your glutes.",
      "Lower the weight slowly back to the start.",
    ],
  },
  "hip-thrust": {
    name: "Barbell Hip Thrust",
    steps: [
      "Rest your upper back on a bench with the padded barbell across your hips.",
      "Drive your hips up until your body forms a straight line from shoulders to knees.",
      "Squeeze your glutes hard at the top, then lower with control.",
    ],
  },
  "calf-raise": {
    name: "Standing Calf Raise",
    steps: [
      "Place the balls of your feet on the platform with your heels free.",
      "Push up as high as you can onto your toes.",
      "Lower under control for a deep stretch.",
    ],
  },
  "barbell-bench-press": {
    name: "Barbell Bench Press",
    steps: [
      "Lie flat on the bench with your hands slightly wider than shoulder-width.",
      "Lower the bar to your chest under control.",
      "Press the bar back up explosively.",
    ],
  },
  "incline-db-press": {
    name: "Incline Dumbbell Press",
    steps: [
      "Set the bench to 30–45°.",
      "Press the dumbbells up over your chest.",
      "Lower them under control to chest level.",
    ],
  },
  "cable-fly": {
    name: "Cable Chest Fly",
    steps: [
      "Stand between two high pulleys with a slight forward lean.",
      "Bring your hands together in front of your chest in a wide arc.",
      "Hold the squeeze and return under control.",
    ],
  },
  "push-up": {
    name: "Push Up",
    steps: [
      "Start in a plank with your hands at shoulder-width.",
      "Lower yourself until your chest is just above the floor.",
      "Push back up to the start.",
    ],
  },
  "lat-pulldown": {
    name: "Lat Pulldown",
    steps: [
      "Grab the bar slightly wider than shoulder-width.",
      "Pull the bar to your upper chest, driving your elbows down.",
      "Return to the start under control.",
    ],
  },
  "barbell-row": {
    name: "Barbell Bent Over Row",
    steps: [
      "Hinge at the hips with a flat back, bar in front of your legs.",
      "Row the bar to your lower chest / upper abs.",
      "Squeeze your shoulder blades together, then lower.",
    ],
  },
  "seated-cable-row": {
    name: "Seated Cable Row",
    steps: [
      "Sit upright with a slight knee bend, grips in hand.",
      "Pull the handles to your stomach.",
      "Squeeze your shoulder blades together.",
    ],
  },
  "pull-up": {
    name: "Pull Up",
    steps: [
      "Hang from the bar with hands wider than your shoulders.",
      "Pull yourself up until your chin clears the bar.",
      "Lower yourself all the way down under control.",
    ],
  },
  deadlift: {
    name: "Conventional Deadlift",
    steps: [
      "Feet hip-width, bar over the middle of your foot.",
      "Grip the bar with a flat back and chest up.",
      "Stand up by driving your hips and knees through.",
    ],
  },
  "overhead-press": {
    name: "Overhead Press",
    steps: [
      "Hold the bar at shoulder height, feet hip-width apart.",
      "Press the bar straight overhead until your arms lock out.",
      "Lower the bar under control back to your shoulders.",
    ],
  },
  "lateral-raise": {
    name: "Dumbbell Lateral Raise",
    steps: [
      "Hold dumbbells at your sides with a slight bend in the elbows.",
      "Raise your arms out to the sides up to shoulder height.",
      "Lower them slowly.",
    ],
  },
  "face-pull": {
    name: "Face Pull",
    steps: [
      "Attach a rope to a high pulley, grab with an overhand grip.",
      "Pull the rope toward your face with elbows high and wide.",
      "Squeeze your rear delts at the end.",
    ],
  },
  "barbell-curl": {
    name: "Barbell Curl",
    steps: [
      "Hold the bar with an underhand grip and elbows tucked.",
      "Curl the bar up toward your shoulders.",
      "Lower under control.",
    ],
  },
  "hammer-curl": {
    name: "Hammer Curl",
    steps: [
      "Hold dumbbells at your sides with palms facing in.",
      "Curl them up without rotating your wrists.",
      "Lower under control.",
    ],
  },
  "triceps-pushdown": {
    name: "Triceps Pushdown",
    steps: [
      "Grip a straight bar or rope at a high pulley.",
      "Keep your elbows pinned at your sides.",
      "Push down until your arms are fully extended.",
    ],
  },
  "skull-crusher": {
    name: "Skull Crusher",
    steps: [
      "Lie on a bench with an EZ bar held over your chest.",
      "Bend only at your elbows to lower the bar toward your forehead.",
      "Extend your arms back up.",
    ],
  },
  plank: {
    name: "Plank",
    steps: [
      "Forearms on the floor, body in a straight line.",
      "Brace your core and glutes.",
      "Hold for the prescribed time.",
    ],
  },
  "hanging-leg-raise": {
    name: "Hanging Leg Raise",
    steps: [
      "Hang from a pull-up bar.",
      "Raise your straight legs up to 90°.",
      "Lower them under control.",
    ],
  },
  "cable-crunch": {
    name: "Cable Crunch",
    steps: [
      "Kneel below a high pulley with the rope beside your head.",
      "Crunch down by contracting your abs.",
      "Return to the start slowly.",
    ],
  },
};

const nl: Pack = {
  "wide-leg-press": {
    name: "Brede Beenpers",
    steps: [
      "Ga in de machine zitten met je voeten breed op het platform.",
      "Duw het platform weg tot je benen bijna gestrekt zijn (knieën licht gebogen).",
      "Laat het gewicht langzaam zakken tot je knieën ongeveer 90° buigen.",
      "Houd je rug tegen het kussen en span je quads aan.",
    ],
  },
  "barbell-squat": {
    name: "Barbell Back Squat",
    steps: [
      "Plaats de barbell op je bovenrug, voeten op schouderbreedte.",
      "Zak gecontroleerd tot je dijen parallel aan de grond zijn.",
      "Duw door je hielen omhoog naar de startpositie.",
    ],
  },
  "romanian-deadlift": {
    name: "Romanian Deadlift",
    steps: [
      "Houd de barbell voor je dijen met een lichte knie-buiging.",
      "Scharnier vanuit je heupen naar voren, rug recht.",
      "Voel de rek in je hamstrings en stuw je heupen weer naar voren om recht te staan.",
    ],
  },
  "leg-extension": {
    name: "Leg Extension",
    steps: [
      "Stel de machine in zodat je knieën gelijk staan met het draaipunt.",
      "Strek je benen volledig en knijp 1 seconde in de top.",
      "Laat gecontroleerd zakken.",
    ],
  },
  "lying-leg-curl": {
    name: "Liggende Beencurl",
    steps: [
      "Ga op je buik liggen met je hielen onder de roller.",
      "Buig je knieën om de roller richting je billen te brengen.",
      "Laat langzaam terug zakken.",
    ],
  },
  "hip-thrust": {
    name: "Barbell Hip Thrust",
    steps: [
      "Leg je schouders op een bank met de gepolsterde barbell over je heupen.",
      "Stuw je heupen omhoog tot je lichaam een rechte lijn vormt van schouder tot knie.",
      "Knijp je billen hard aan in de top en laat gecontroleerd zakken.",
    ],
  },
  "calf-raise": {
    name: "Staande Kuithef",
    steps: [
      "Plaats je voorvoeten op het platform, hielen vrij.",
      "Druk zo hoog mogelijk op je tenen.",
      "Laat gecontroleerd zakken voor maximale rek.",
    ],
  },
  "barbell-bench-press": {
    name: "Barbell Bench Press",
    steps: [
      "Lig plat op de bank, handen iets breder dan schouderbreedte.",
      "Laat de stang gecontroleerd zakken tot je borst.",
      "Druk explosief omhoog.",
    ],
  },
  "incline-db-press": {
    name: "Incline Dumbbell Press",
    steps: [
      "Stel de bank in op 30–45°.",
      "Druk de dumbbells boven je borst omhoog.",
      "Laat ze gecontroleerd zakken tot borsthoogte.",
    ],
  },
  "cable-fly": {
    name: "Cable Chest Fly",
    steps: [
      "Sta tussen twee high pulleys met een lichte voorover-buiging.",
      "Breng je handen samen voor je borst in een wijde boog.",
      "Houd de spanning vast en ga gecontroleerd terug.",
    ],
  },
  "push-up": {
    name: "Push-up",
    steps: [
      "Start in een plank met je handen op schouderbreedte.",
      "Zak tot je borst de grond bijna raakt.",
      "Duw jezelf weer omhoog naar de start.",
    ],
  },
  "lat-pulldown": {
    name: "Lat Pulldown",
    steps: [
      "Pak de stang iets breder dan schouderbreedte.",
      "Trek de stang naar je bovenborst, ellebogen omlaag.",
      "Laat gecontroleerd terug omhoog gaan.",
    ],
  },
  "barbell-row": {
    name: "Barbell Bent Over Row",
    steps: [
      "Scharnier vanuit je heupen met een rechte rug, stang voor je benen.",
      "Trek de stang naar je onderborst / bovenbuik.",
      "Knijp je schouderbladen samen en laat zakken.",
    ],
  },
  "seated-cable-row": {
    name: "Zittende Kabel Roei",
    steps: [
      "Zit rechtop met een lichte knie-buiging, grip in je handen.",
      "Trek de handvatten naar je buik.",
      "Knijp je schouderbladen samen.",
    ],
  },
  "pull-up": {
    name: "Pull-up",
    steps: [
      "Hang aan de stang met je handen breder dan je schouders.",
      "Trek jezelf op tot je kin boven de stang is.",
      "Laat volledig gecontroleerd zakken.",
    ],
  },
  deadlift: {
    name: "Conventionele Deadlift",
    steps: [
      "Voeten op heupbreedte, stang boven het midden van je voet.",
      "Pak de stang vast met een rechte rug en borst omhoog.",
      "Sta op door je heupen en knieën te strekken.",
    ],
  },
  "overhead-press": {
    name: "Overhead Press",
    steps: [
      "Stang op schouderhoogte, voeten op heupbreedte.",
      "Druk de stang recht omhoog tot je armen gestrekt zijn.",
      "Laat gecontroleerd zakken naar je schouders.",
    ],
  },
  "lateral-raise": {
    name: "Dumbbell Zijwaartse Hef",
    steps: [
      "Dumbbells naast je lichaam, lichte buiging in de ellebogen.",
      "Til zijwaarts tot schouderhoogte.",
      "Laat langzaam zakken.",
    ],
  },
  "face-pull": {
    name: "Face Pull",
    steps: [
      "Touw aan een high pulley, pak met overhandse greep.",
      "Trek het touw naar je gezicht, ellebogen hoog en breed.",
      "Knijp je achterste deltoids aan op het einde.",
    ],
  },
  "barbell-curl": {
    name: "Barbell Curl",
    steps: [
      "Pak de stang onderhands, ellebogen tegen je lichaam.",
      "Krul de stang omhoog naar je schouders.",
      "Laat gecontroleerd zakken.",
    ],
  },
  "hammer-curl": {
    name: "Hammer Curl",
    steps: [
      "Dumbbells naast je lichaam, palmen naar binnen.",
      "Krul omhoog zonder je polsen te draaien.",
      "Laat gecontroleerd zakken.",
    ],
  },
  "triceps-pushdown": {
    name: "Triceps Pushdown",
    steps: [
      "Pak een rechte stang of touw aan een high pulley.",
      "Houd je ellebogen tegen je lichaam.",
      "Druk naar beneden tot je armen volledig gestrekt zijn.",
    ],
  },
  "skull-crusher": {
    name: "Skull Crusher",
    steps: [
      "Lig op een bank met een EZ-bar boven je borst.",
      "Buig alleen je ellebogen om de stang naar je voorhoofd te laten zakken.",
      "Strek je armen weer.",
    ],
  },
  plank: {
    name: "Plank",
    steps: [
      "Onderarmen op de grond, lichaam in een rechte lijn.",
      "Span je buik en billen aan.",
      "Houd vast voor de gewenste tijd.",
    ],
  },
  "hanging-leg-raise": {
    name: "Hangende Beenhef",
    steps: [
      "Hang aan een pull-up stang.",
      "Til je gestrekte benen omhoog tot 90°.",
      "Laat gecontroleerd zakken.",
    ],
  },
  "cable-crunch": {
    name: "Kabel Crunch",
    steps: [
      "Kniel onder een high pulley met het touw naast je hoofd.",
      "Crunch naar beneden door je buikspieren aan te spannen.",
      "Kom langzaam terug omhoog.",
    ],
  },
};

const ar: Pack = {
  "wide-leg-press": {
    name: "ضغط الساق الواسع",
    steps: [
      "اجلس في الجهاز وضع قدميك متباعدتين على المنصة.",
      "ادفع المنصة بعيداً حتى تصبح ساقاك مستقيمتين تقريباً (مع ثني خفيف في الركبتين).",
      "أنزل الوزن ببطء حتى تنحني ركبتاك بزاوية 90° تقريباً.",
      "حافظ على ظهرك ملتصقاً بالوسادة واضغط على عضلات الفخذ الأمامية.",
    ],
  },
  "barbell-squat": {
    name: "سكوات الباربيل الخلفي",
    steps: [
      "ضع الباربيل على أعلى ظهرك، مع مباعدة قدميك بعرض الكتفين.",
      "انزل بتحكم حتى يصبح الفخذان موازيين للأرض.",
      "ادفع بكعبيك للعودة إلى نقطة البداية.",
    ],
  },
  "romanian-deadlift": {
    name: "الديدليفت الروماني",
    steps: [
      "أمسك الباربيل أمام فخذيك مع ثني خفيف في الركبتين.",
      "انحنِ للأمام من الوركين مع الحفاظ على ظهر مستقيم.",
      "اشعر بالشد في عضلات الساق الخلفية ثم ادفع وركيك للأمام للعودة.",
    ],
  },
  "leg-extension": {
    name: "تمديد الساق",
    steps: [
      "اضبط الجهاز بحيث تكون ركبتاك على مستوى محور الدوران.",
      "مدّ ساقيك بالكامل واضغط على عضلات الفخذ لمدة ثانية في الأعلى.",
      "أنزل الوزن بتحكم.",
    ],
  },
  "lying-leg-curl": {
    name: "ثني الساق وأنت مستلقٍ",
    steps: [
      "استلقِ على بطنك مع وضع كعبيك تحت الأسطوانة.",
      "اثنِ ركبتيك لتقريب الأسطوانة من المؤخرة.",
      "أنزل الوزن ببطء.",
    ],
  },
  "hip-thrust": {
    name: "دفع الورك بالباربيل",
    steps: [
      "ضع كتفيك على المقعد والباربيل المبطن فوق وركيك.",
      "ادفع وركيك للأعلى حتى يشكل جسمك خطاً مستقيماً من الكتف إلى الركبة.",
      "اضغط على عضلات المؤخرة بقوة في الأعلى ثم أنزل بتحكم.",
    ],
  },
  "calf-raise": {
    name: "رفع السمانة وقوفاً",
    steps: [
      "ضع مقدمة قدميك على المنصة وكعبيك حران.",
      "ادفع نفسك للأعلى على أطراف أصابع قدميك قدر الإمكان.",
      "أنزل بتحكم للحصول على مدّ كامل.",
    ],
  },
  "barbell-bench-press": {
    name: "بنش برس بالباربيل",
    steps: [
      "استلقِ مسطحاً على المقعد، يديك أوسع قليلاً من عرض الكتفين.",
      "أنزل الباربيل بتحكم حتى يصل إلى صدرك.",
      "ادفع الباربيل للأعلى بقوة.",
    ],
  },
  "incline-db-press": {
    name: "ضغط الدمبل على المائل",
    steps: [
      "اضبط المقعد على 30–45°.",
      "ادفع الدمبلز للأعلى فوق صدرك.",
      "أنزلهم بتحكم إلى مستوى الصدر.",
    ],
  },
  "cable-fly": {
    name: "تفتيح الصدر بالكابل",
    steps: [
      "قف بين بكرتين علويتين مع ميل خفيف للأمام.",
      "اجمع يديك أمام صدرك في قوس واسع.",
      "حافظ على الضغط ثم عُد بتحكم.",
    ],
  },
  "push-up": {
    name: "تمرين الضغط",
    steps: [
      "ابدأ بوضعية البلانك مع يديك بعرض الكتفين.",
      "أنزل نفسك حتى يقترب صدرك من الأرض.",
      "ادفع نفسك مرة أخرى للأعلى.",
    ],
  },
  "lat-pulldown": {
    name: "سحب اللات",
    steps: [
      "أمسك القضيب أوسع قليلاً من عرض الكتفين.",
      "اسحب القضيب إلى أعلى صدرك مع توجيه مرفقيك للأسفل.",
      "عُد إلى البداية بتحكم.",
    ],
  },
  "barbell-row": {
    name: "تجديف الباربيل المنحني",
    steps: [
      "انحنِ من الوركين بظهر مستقيم، القضيب أمام ساقيك.",
      "اسحب القضيب إلى أسفل صدرك / أعلى البطن.",
      "اضغط لوحَي كتفيك معاً ثم أنزل.",
    ],
  },
  "seated-cable-row": {
    name: "تجديف الكابل جالساً",
    steps: [
      "اجلس باستقامة مع ثني خفيف في الركبتين، المقابض في يديك.",
      "اسحب المقابض إلى بطنك.",
      "اضغط لوحَي كتفيك معاً.",
    ],
  },
  "pull-up": {
    name: "العقلة",
    steps: [
      "تعلق على القضيب بيدين أوسع من كتفيك.",
      "اسحب نفسك لأعلى حتى يتجاوز ذقنك القضيب.",
      "أنزل نفسك بالكامل بتحكم.",
    ],
  },
  deadlift: {
    name: "الديدليفت التقليدي",
    steps: [
      "القدمان بعرض الورك، القضيب فوق منتصف قدمك.",
      "أمسك القضيب مع ظهر مستقيم وصدر مرفوع.",
      "قف بدفع وركيك وركبتيك.",
    ],
  },
  "overhead-press": {
    name: "الضغط فوق الرأس",
    steps: [
      "أمسك القضيب عند مستوى الكتف، القدمان بعرض الورك.",
      "ادفع القضيب مباشرة فوق رأسك حتى تستقيم ذراعاك.",
      "أنزل القضيب بتحكم إلى كتفيك.",
    ],
  },
  "lateral-raise": {
    name: "الرفع الجانبي بالدمبل",
    steps: [
      "أمسك الدمبلز بجانبيك مع ثني خفيف في المرفقين.",
      "ارفع ذراعيك جانباً حتى مستوى الكتف.",
      "أنزلهما ببطء.",
    ],
  },
  "face-pull": {
    name: "سحب الوجه",
    steps: [
      "ركّب حبلاً على بكرة عالية، أمسكه بقبضة علوية.",
      "اسحب الحبل نحو وجهك مع رفع مرفقيك عالياً ومتباعدين.",
      "اضغط على الكتف الخلفي في النهاية.",
    ],
  },
  "barbell-curl": {
    name: "كيرل الباربيل",
    steps: [
      "أمسك القضيب بقبضة سفلية ومرفقاك ملتصقان بجسمك.",
      "ارفع القضيب نحو كتفيك.",
      "أنزل بتحكم.",
    ],
  },
  "hammer-curl": {
    name: "كيرل المطرقة",
    steps: [
      "أمسك الدمبلز بجانبيك مع توجيه الكفين للداخل.",
      "ارفعهما دون تدوير المعصمين.",
      "أنزل بتحكم.",
    ],
  },
  "triceps-pushdown": {
    name: "دفع الترايسبس",
    steps: [
      "أمسك قضيباً مستقيماً أو حبلاً على بكرة عالية.",
      "حافظ على مرفقيك ملتصقين بجسمك.",
      "ادفع للأسفل حتى تستقيم ذراعاك بالكامل.",
    ],
  },
  "skull-crusher": {
    name: "سكول كراشر",
    steps: [
      "استلقِ على مقعد مع إمساك EZ-bar فوق صدرك.",
      "اثنِ مرفقيك فقط لإنزال القضيب نحو جبهتك.",
      "مدّ ذراعيك مرة أخرى.",
    ],
  },
  plank: {
    name: "البلانك",
    steps: [
      "السواعد على الأرض، الجسم في خط مستقيم.",
      "شدّ بطنك وعضلات المؤخرة.",
      "احتفظ بالوضعية للوقت المطلوب.",
    ],
  },
  "hanging-leg-raise": {
    name: "رفع الساق معلقاً",
    steps: [
      "تعلق على قضيب العقلة.",
      "ارفع ساقيك المستقيمتين حتى زاوية 90°.",
      "أنزلهما بتحكم.",
    ],
  },
  "cable-crunch": {
    name: "كرنش الكابل",
    steps: [
      "اركع تحت بكرة عالية مع الحبل بجانب رأسك.",
      "اقبض للأسفل بتقليص عضلات البطن.",
      "عُد إلى البداية ببطء.",
    ],
  },
};

const fr: Pack = {
  "wide-leg-press": {
    name: "Presse à jambes large",
    steps: [
      "Asseyez-vous dans la machine, pieds écartés sur la plateforme.",
      "Poussez la plateforme jusqu'à ce que vos jambes soient presque tendues (genoux légèrement fléchis).",
      "Descendez lentement jusqu'à ce que vos genoux soient pliés à environ 90°.",
      "Gardez le dos contre le coussin et contractez les quadriceps.",
    ],
  },
  "barbell-squat": {
    name: "Squat arrière à la barre",
    steps: [
      "Placez la barre sur le haut du dos, pieds à largeur d'épaules.",
      "Descendez de manière contrôlée jusqu'à ce que vos cuisses soient parallèles au sol.",
      "Poussez sur les talons pour revenir à la position de départ.",
    ],
  },
  "romanian-deadlift": {
    name: "Soulevé de terre roumain",
    steps: [
      "Tenez la barre devant les cuisses, genoux légèrement fléchis.",
      "Penchez-vous depuis les hanches en gardant le dos plat.",
      "Sentez l'étirement dans les ischio-jambiers puis poussez les hanches en avant.",
    ],
  },
  "leg-extension": {
    name: "Extension des jambes",
    steps: [
      "Réglez la machine pour que vos genoux soient alignés avec le pivot.",
      "Tendez complètement vos jambes et contractez 1 seconde en haut.",
      "Descendez le poids de manière contrôlée.",
    ],
  },
  "lying-leg-curl": {
    name: "Leg curl allongé",
    steps: [
      "Allongez-vous sur le ventre, talons sous le rouleau.",
      "Pliez les genoux pour amener le rouleau vers les fessiers.",
      "Redescendez lentement.",
    ],
  },
  "hip-thrust": {
    name: "Hip thrust à la barre",
    steps: [
      "Posez le haut du dos sur un banc, barre rembourrée sur les hanches.",
      "Poussez les hanches vers le haut jusqu'à former une ligne droite épaules-genoux.",
      "Contractez fort les fessiers en haut puis redescendez.",
    ],
  },
  "calf-raise": {
    name: "Élévation des mollets debout",
    steps: [
      "Placez la pointe des pieds sur la plateforme, talons libres.",
      "Poussez le plus haut possible sur la pointe des pieds.",
      "Redescendez de manière contrôlée pour un étirement complet.",
    ],
  },
  "barbell-bench-press": {
    name: "Développé couché à la barre",
    steps: [
      "Allongez-vous à plat, mains un peu plus larges que les épaules.",
      "Descendez la barre vers la poitrine de manière contrôlée.",
      "Poussez la barre vers le haut de façon explosive.",
    ],
  },
  "incline-db-press": {
    name: "Développé incliné aux haltères",
    steps: [
      "Réglez le banc à 30–45°.",
      "Poussez les haltères au-dessus de la poitrine.",
      "Redescendez-les de manière contrôlée à hauteur de poitrine.",
    ],
  },
  "cable-fly": {
    name: "Écarté à la poulie haute",
    steps: [
      "Placez-vous entre deux poulies hautes, légère inclinaison avant.",
      "Rapprochez vos mains devant la poitrine en arc de cercle.",
      "Maintenez la contraction puis revenez de manière contrôlée.",
    ],
  },
  "push-up": {
    name: "Pompes",
    steps: [
      "Position de planche, mains à largeur d'épaules.",
      "Descendez jusqu'à ce que la poitrine effleure le sol.",
      "Poussez pour remonter.",
    ],
  },
  "lat-pulldown": {
    name: "Tirage vertical",
    steps: [
      "Attrapez la barre un peu plus large que les épaules.",
      "Tirez la barre vers le haut de la poitrine, coudes vers le bas.",
      "Remontez de manière contrôlée.",
    ],
  },
  "barbell-row": {
    name: "Rowing barre buste penché",
    steps: [
      "Penchez-vous depuis les hanches, dos plat, barre devant les jambes.",
      "Tirez la barre vers le bas de la poitrine / haut de l'abdomen.",
      "Serrez les omoplates puis redescendez.",
    ],
  },
  "seated-cable-row": {
    name: "Rowing assis à la poulie",
    steps: [
      "Asseyez-vous droit, légère flexion des genoux, poignées en main.",
      "Tirez les poignées vers le ventre.",
      "Serrez les omoplates.",
    ],
  },
  "pull-up": {
    name: "Traction",
    steps: [
      "Suspendez-vous à la barre, mains plus larges que les épaules.",
      "Tirez-vous vers le haut jusqu'à ce que le menton dépasse la barre.",
      "Redescendez complètement de manière contrôlée.",
    ],
  },
  deadlift: {
    name: "Soulevé de terre conventionnel",
    steps: [
      "Pieds à largeur de hanches, barre au-dessus du milieu du pied.",
      "Saisissez la barre, dos plat, poitrine ouverte.",
      "Levez-vous en poussant hanches et genoux.",
    ],
  },
  "overhead-press": {
    name: "Développé militaire",
    steps: [
      "Barre à hauteur d'épaules, pieds à largeur de hanches.",
      "Poussez la barre droit au-dessus de la tête bras tendus.",
      "Redescendez de manière contrôlée jusqu'aux épaules.",
    ],
  },
  "lateral-raise": {
    name: "Élévations latérales aux haltères",
    steps: [
      "Haltères le long du corps, légère flexion des coudes.",
      "Levez les bras sur les côtés jusqu'à hauteur d'épaules.",
      "Redescendez lentement.",
    ],
  },
  "face-pull": {
    name: "Face pull",
    steps: [
      "Fixez une corde à une poulie haute, prise pronation.",
      "Tirez la corde vers le visage, coudes hauts et écartés.",
      "Contractez les deltoïdes postérieurs en fin de mouvement.",
    ],
  },
  "barbell-curl": {
    name: "Curl à la barre",
    steps: [
      "Tenez la barre en supination, coudes contre le corps.",
      "Enroulez la barre vers les épaules.",
      "Redescendez de manière contrôlée.",
    ],
  },
  "hammer-curl": {
    name: "Curl marteau",
    steps: [
      "Haltères le long du corps, paumes face à face.",
      "Enroulez sans tourner les poignets.",
      "Redescendez de manière contrôlée.",
    ],
  },
  "triceps-pushdown": {
    name: "Extension triceps à la poulie",
    steps: [
      "Saisissez une barre droite ou une corde à la poulie haute.",
      "Gardez les coudes collés au corps.",
      "Poussez vers le bas jusqu'à extension complète des bras.",
    ],
  },
  "skull-crusher": {
    name: "Skull crusher",
    steps: [
      "Allongé sur un banc, EZ-bar au-dessus de la poitrine.",
      "Pliez uniquement les coudes pour descendre la barre vers le front.",
      "Tendez à nouveau les bras.",
    ],
  },
  plank: {
    name: "Planche",
    steps: [
      "Avant-bras au sol, corps aligné.",
      "Contractez les abdos et les fessiers.",
      "Maintenez pendant la durée prescrite.",
    ],
  },
  "hanging-leg-raise": {
    name: "Relevé de jambes suspendu",
    steps: [
      "Suspendez-vous à une barre de traction.",
      "Levez les jambes tendues jusqu'à 90°.",
      "Redescendez de manière contrôlée.",
    ],
  },
  "cable-crunch": {
    name: "Crunch à la poulie",
    steps: [
      "Agenouillez-vous sous une poulie haute, corde près de la tête.",
      "Crunchez vers le bas en contractant les abdos.",
      "Revenez lentement.",
    ],
  },
};

const de: Pack = {
  "wide-leg-press": {
    name: "Beinpresse breit",
    steps: [
      "Setze dich in die Maschine, Füße breit auf der Plattform.",
      "Drücke die Plattform weg, bis die Beine fast gestreckt sind (Knie leicht gebeugt).",
      "Senke das Gewicht langsam ab, bis die Knie etwa 90° gebeugt sind.",
      "Halte den Rücken am Polster und spanne die Oberschenkel an.",
    ],
  },
  "barbell-squat": {
    name: "Langhantel-Kniebeuge",
    steps: [
      "Lege die Langhantel auf den oberen Rücken, Füße schulterbreit.",
      "Gehe kontrolliert in die Hocke, bis die Oberschenkel parallel zum Boden sind.",
      "Drücke dich über die Fersen zurück nach oben.",
    ],
  },
  "romanian-deadlift": {
    name: "Rumänisches Kreuzheben",
    steps: [
      "Halte die Hantel vor den Oberschenkeln mit leicht gebeugten Knien.",
      "Beuge dich aus der Hüfte nach vorn, Rücken bleibt gerade.",
      "Spüre die Dehnung in den Hamstrings und drücke die Hüfte zurück nach vorn.",
    ],
  },
  "leg-extension": {
    name: "Beinstrecker",
    steps: [
      "Stelle die Maschine so ein, dass die Knie am Drehpunkt liegen.",
      "Strecke die Beine vollständig und halte 1 Sekunde oben.",
      "Senke das Gewicht kontrolliert ab.",
    ],
  },
  "lying-leg-curl": {
    name: "Beincurl liegend",
    steps: [
      "Lege dich auf den Bauch, Fersen unter der Rolle.",
      "Beuge die Knie und ziehe die Rolle Richtung Gesäß.",
      "Senke langsam ab.",
    ],
  },
  "hip-thrust": {
    name: "Hip Thrust mit Langhantel",
    steps: [
      "Schultern auf eine Bank, gepolsterte Langhantel über die Hüfte.",
      "Drücke die Hüfte nach oben, bis Körper eine Linie von Schulter zu Knie bildet.",
      "Spanne das Gesäß oben fest an und senke kontrolliert ab.",
    ],
  },
  "calf-raise": {
    name: "Stehendes Wadenheben",
    steps: [
      "Stelle die Fußballen auf die Plattform, Fersen frei.",
      "Drücke dich so hoch wie möglich auf die Zehen.",
      "Senke kontrolliert ab für maximale Dehnung.",
    ],
  },
  "barbell-bench-press": {
    name: "Bankdrücken mit Langhantel",
    steps: [
      "Lege dich flach auf die Bank, Hände etwas breiter als schulterbreit.",
      "Senke die Stange kontrolliert zur Brust.",
      "Drücke die Stange explosiv nach oben.",
    ],
  },
  "incline-db-press": {
    name: "Schrägbankdrücken mit Kurzhanteln",
    steps: [
      "Stelle die Bank auf 30–45°.",
      "Drücke die Kurzhanteln über der Brust nach oben.",
      "Senke sie kontrolliert auf Brusthöhe ab.",
    ],
  },
  "cable-fly": {
    name: "Kabel-Fly für die Brust",
    steps: [
      "Stelle dich zwischen zwei hohe Züge, leichte Vorbeuge.",
      "Führe die Hände vor der Brust in weitem Bogen zusammen.",
      "Halte die Spannung und gehe kontrolliert zurück.",
    ],
  },
  "push-up": {
    name: "Liegestütz",
    steps: [
      "Starte in der Plank-Position, Hände schulterbreit.",
      "Senke dich ab, bis die Brust knapp über dem Boden ist.",
      "Drücke dich zurück nach oben.",
    ],
  },
  "lat-pulldown": {
    name: "Latziehen",
    steps: [
      "Greife die Stange etwas breiter als schulterbreit.",
      "Ziehe die Stange zur oberen Brust, Ellbogen nach unten.",
      "Lasse kontrolliert zurück nach oben.",
    ],
  },
  "barbell-row": {
    name: "Langhantelrudern vorgebeugt",
    steps: [
      "Hüftbeuge mit geradem Rücken, Stange vor den Beinen.",
      "Ziehe die Stange zur unteren Brust / zum oberen Bauch.",
      "Ziehe die Schulterblätter zusammen und senke ab.",
    ],
  },
  "seated-cable-row": {
    name: "Kabelrudern sitzend",
    steps: [
      "Sitze aufrecht mit leicht gebeugten Knien, Griffe in den Händen.",
      "Ziehe die Griffe zum Bauch.",
      "Ziehe die Schulterblätter zusammen.",
    ],
  },
  "pull-up": {
    name: "Klimmzug",
    steps: [
      "Hänge an der Stange, Hände breiter als die Schultern.",
      "Ziehe dich hoch, bis das Kinn über der Stange ist.",
      "Senke dich vollständig kontrolliert ab.",
    ],
  },
  deadlift: {
    name: "Konventionelles Kreuzheben",
    steps: [
      "Füße hüftbreit, Stange über Mittelfuß.",
      "Greife die Stange mit geradem Rücken und gehobener Brust.",
      "Stehe auf, indem du Hüfte und Knie streckst.",
    ],
  },
  "overhead-press": {
    name: "Schulterdrücken",
    steps: [
      "Stange auf Schulterhöhe, Füße hüftbreit.",
      "Drücke die Stange gerade nach oben bis die Arme gestreckt sind.",
      "Senke kontrolliert zurück zu den Schultern.",
    ],
  },
  "lateral-raise": {
    name: "Seitheben mit Kurzhanteln",
    steps: [
      "Kurzhanteln seitlich am Körper, Ellbogen leicht gebeugt.",
      "Hebe die Arme seitlich bis auf Schulterhöhe.",
      "Senke langsam ab.",
    ],
  },
  "face-pull": {
    name: "Face Pull",
    steps: [
      "Seil an einen hohen Zug, im Obergriff fassen.",
      "Ziehe das Seil zum Gesicht, Ellbogen hoch und weit.",
      "Spanne die hintere Schulter am Ende an.",
    ],
  },
  "barbell-curl": {
    name: "Langhantel-Curl",
    steps: [
      "Stange im Untergriff, Ellbogen am Körper.",
      "Curle die Stange hoch zu den Schultern.",
      "Senke kontrolliert ab.",
    ],
  },
  "hammer-curl": {
    name: "Hammer-Curl",
    steps: [
      "Kurzhanteln seitlich am Körper, Handflächen nach innen.",
      "Curle hoch, ohne die Handgelenke zu drehen.",
      "Senke kontrolliert ab.",
    ],
  },
  "triceps-pushdown": {
    name: "Trizepsdrücken am Kabel",
    steps: [
      "Greife eine gerade Stange oder ein Seil am hohen Zug.",
      "Halte die Ellbogen am Körper.",
      "Drücke nach unten, bis die Arme vollständig gestreckt sind.",
    ],
  },
  "skull-crusher": {
    name: "Skull Crusher",
    steps: [
      "Lege dich auf eine Bank, EZ-Stange über der Brust.",
      "Beuge nur die Ellbogen, um die Stange zur Stirn zu senken.",
      "Strecke die Arme wieder.",
    ],
  },
  plank: {
    name: "Plank",
    steps: [
      "Unterarme auf den Boden, Körper in einer geraden Linie.",
      "Spanne Bauch und Gesäß an.",
      "Halte für die vorgegebene Zeit.",
    ],
  },
  "hanging-leg-raise": {
    name: "Hängendes Beinheben",
    steps: [
      "Hänge an einer Klimmzugstange.",
      "Hebe die gestreckten Beine bis 90° an.",
      "Senke kontrolliert ab.",
    ],
  },
  "cable-crunch": {
    name: "Kabel-Crunch",
    steps: [
      "Knie unter einem hohen Zug, Seil neben dem Kopf.",
      "Crunche nach unten, indem du die Bauchmuskeln anspannst.",
      "Komme langsam wieder hoch.",
    ],
  },
};

const es: Pack = {
  "wide-leg-press": {
    name: "Prensa de piernas amplia",
    steps: [
      "Siéntate en la máquina con los pies separados sobre la plataforma.",
      "Empuja la plataforma hasta que las piernas estén casi rectas (rodillas ligeramente flexionadas).",
      "Baja el peso lentamente hasta que las rodillas se flexionen a unos 90°.",
      "Mantén la espalda contra el respaldo y aprieta los cuádriceps.",
    ],
  },
  "barbell-squat": {
    name: "Sentadilla trasera con barra",
    steps: [
      "Coloca la barra sobre la parte alta de la espalda, pies al ancho de hombros.",
      "Baja de forma controlada hasta que los muslos queden paralelos al suelo.",
      "Empuja con los talones para volver a la posición inicial.",
    ],
  },
  "romanian-deadlift": {
    name: "Peso muerto rumano",
    steps: [
      "Sujeta la barra frente a los muslos con una ligera flexión de rodillas.",
      "Flexiona desde la cadera hacia delante, manteniendo la espalda recta.",
      "Siente el estiramiento en los isquiotibiales y lleva las caderas hacia delante.",
    ],
  },
  "leg-extension": {
    name: "Extensión de piernas",
    steps: [
      "Ajusta la máquina para que las rodillas queden alineadas con el pivote.",
      "Extiende las piernas por completo y aprieta 1 segundo arriba.",
      "Baja el peso de forma controlada.",
    ],
  },
  "lying-leg-curl": {
    name: "Curl femoral tumbado",
    steps: [
      "Túmbate boca abajo con los talones bajo el rodillo.",
      "Flexiona las rodillas para llevar el rodillo hacia los glúteos.",
      "Baja lentamente.",
    ],
  },
  "hip-thrust": {
    name: "Hip thrust con barra",
    steps: [
      "Apoya la parte alta de la espalda en un banco con la barra acolchada sobre las caderas.",
      "Empuja las caderas arriba hasta formar una línea recta hombros-rodillas.",
      "Aprieta fuerte los glúteos arriba y baja de forma controlada.",
    ],
  },
  "calf-raise": {
    name: "Elevación de gemelos de pie",
    steps: [
      "Coloca la parte delantera de los pies en la plataforma, talones libres.",
      "Empuja hacia arriba sobre las puntas lo más alto posible.",
      "Baja de forma controlada para un estiramiento profundo.",
    ],
  },
  "barbell-bench-press": {
    name: "Press de banca con barra",
    steps: [
      "Túmbate sobre el banco con las manos algo más anchas que los hombros.",
      "Baja la barra hacia el pecho de forma controlada.",
      "Empuja la barra arriba de forma explosiva.",
    ],
  },
  "incline-db-press": {
    name: "Press inclinado con mancuernas",
    steps: [
      "Ajusta el banco a 30–45°.",
      "Empuja las mancuernas hacia arriba sobre el pecho.",
      "Bájalas de forma controlada hasta la altura del pecho.",
    ],
  },
  "cable-fly": {
    name: "Aperturas en polea",
    steps: [
      "Colócate entre dos poleas altas con una ligera inclinación.",
      "Junta las manos frente al pecho en un arco amplio.",
      "Mantén la contracción y vuelve de forma controlada.",
    ],
  },
  "push-up": {
    name: "Flexiones",
    steps: [
      "Posición de plancha con las manos al ancho de hombros.",
      "Baja hasta que el pecho casi roce el suelo.",
      "Empuja para volver arriba.",
    ],
  },
  "lat-pulldown": {
    name: "Jalón al pecho",
    steps: [
      "Agarra la barra algo más ancha que los hombros.",
      "Tira de la barra al pecho llevando los codos abajo.",
      "Vuelve de forma controlada.",
    ],
  },
  "barbell-row": {
    name: "Remo con barra inclinado",
    steps: [
      "Flexión de cadera con espalda recta, barra frente a las piernas.",
      "Tira de la barra hacia la parte baja del pecho / abdomen superior.",
      "Aprieta los omóplatos y baja.",
    ],
  },
  "seated-cable-row": {
    name: "Remo sentado en polea",
    steps: [
      "Siéntate erguido con ligera flexión de rodillas, agarres en las manos.",
      "Tira de los agarres hacia el abdomen.",
      "Aprieta los omóplatos.",
    ],
  },
  "pull-up": {
    name: "Dominada",
    steps: [
      "Cuélgate de la barra con las manos más anchas que los hombros.",
      "Súbete hasta pasar la barbilla por encima de la barra.",
      "Baja por completo de forma controlada.",
    ],
  },
  deadlift: {
    name: "Peso muerto convencional",
    steps: [
      "Pies al ancho de cadera, barra sobre el centro del pie.",
      "Agarra la barra con espalda recta y pecho arriba.",
      "Levántate empujando caderas y rodillas.",
    ],
  },
  "overhead-press": {
    name: "Press militar",
    steps: [
      "Barra a la altura de los hombros, pies al ancho de cadera.",
      "Empuja la barra recto sobre la cabeza hasta bloquear los brazos.",
      "Baja de forma controlada a los hombros.",
    ],
  },
  "lateral-raise": {
    name: "Elevaciones laterales con mancuernas",
    steps: [
      "Mancuernas a los lados con ligera flexión de codos.",
      "Eleva los brazos a los lados hasta la altura de los hombros.",
      "Baja lentamente.",
    ],
  },
  "face-pull": {
    name: "Face pull",
    steps: [
      "Coloca una cuerda en una polea alta, agarre en pronación.",
      "Tira de la cuerda hacia la cara con los codos altos y abiertos.",
      "Aprieta los deltoides posteriores al final.",
    ],
  },
  "barbell-curl": {
    name: "Curl con barra",
    steps: [
      "Sujeta la barra en supinación con los codos pegados al cuerpo.",
      "Eleva la barra hacia los hombros.",
      "Baja de forma controlada.",
    ],
  },
  "hammer-curl": {
    name: "Curl martillo",
    steps: [
      "Mancuernas a los lados con las palmas hacia dentro.",
      "Eleva sin girar las muñecas.",
      "Baja de forma controlada.",
    ],
  },
  "triceps-pushdown": {
    name: "Extensión de tríceps en polea",
    steps: [
      "Agarra una barra recta o cuerda en una polea alta.",
      "Mantén los codos pegados al cuerpo.",
      "Empuja hacia abajo hasta extender los brazos por completo.",
    ],
  },
  "skull-crusher": {
    name: "Press francés",
    steps: [
      "Túmbate en un banco con una barra EZ sobre el pecho.",
      "Flexiona solo los codos para bajar la barra hacia la frente.",
      "Extiende los brazos de nuevo.",
    ],
  },
  plank: {
    name: "Plancha",
    steps: [
      "Antebrazos en el suelo, cuerpo en línea recta.",
      "Contrae abdominales y glúteos.",
      "Mantén durante el tiempo indicado.",
    ],
  },
  "hanging-leg-raise": {
    name: "Elevación de piernas colgado",
    steps: [
      "Cuélgate de una barra de dominadas.",
      "Eleva las piernas rectas hasta 90°.",
      "Baja de forma controlada.",
    ],
  },
  "cable-crunch": {
    name: "Crunch en polea",
    steps: [
      "Arrodíllate bajo una polea alta con la cuerda junto a la cabeza.",
      "Crunch hacia abajo contrayendo los abdominales.",
      "Vuelve lentamente.",
    ],
  },
};

const PACKS: Record<Language, Pack> = { en, nl, ar, fr, de, es };

/**
 * Returns translated name and step-by-step instructions for a featured exercise.
 * Falls back to the original `fallbackName` and `fallbackSteps` for exercises
 * without translations (the ~470 catalog-only entries).
 */
export function useExerciseT() {
  const { lang } = useI18n();
  const pack = PACKS[lang as Language] ?? en;
  return (id: string, fallbackName: string, fallbackSteps: string[]) => {
    const entry = pack[id] ?? en[id];
    return {
      name: entry?.name ?? fallbackName,
      steps: entry?.steps ?? fallbackSteps,
    };
  };
}
