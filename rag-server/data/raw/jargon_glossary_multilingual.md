# Basketball Jargon Glossary — Multilingual Reference

---

## Preamble — Purpose of This Glossary for the RAG System

Section summary: This section explains why this multilingual glossary exists in the knowledge base and how it enables the RAG system to handle non-English queries about basketball concepts.

The CoachDiary RAG corpus is written entirely in **English**. Coaches, players, and users from across Europe and beyond may submit queries in their native languages. Without a multilingual bridge, a query written in French, Italian, or Serbian that uses local basketball terminology will fail to match the correct English-language documents in the retrieval step.

This glossary solves that problem. It maps approximately 50 core basketball terms from English to nine other languages: **French, Spanish, German, Italian, Serbian, Greek, Lithuanian, Russian, and Turkish**.

### How the RAG system uses this file

1. When a query arrives in a non-English language, the retrieval pipeline (or the LLM pre-processing step) can scan this glossary to identify known basketball terms in the query language.
2. Those terms are mapped to their English equivalents.
3. The English terms are then used to retrieve the correct chunks from the English-language corpus documents (e.g., `pick_and_roll_offense.md`, `screen_types_glossary.md`, `set_plays_horns_family.md`).

### Coverage note

The terms below cover the most frequently searched basketball concepts in CoachDiary: play-type terms, court zones, positions, defensive coverages, and fundamental actions. Where a term is borrowed directly from English into another language (e.g., "dribble" is used as-is in many European languages), the cell reflects the borrowed form rather than a literal translation. Serbian is rendered in Cyrillic (Ћирилица), the official script of the Serbian Basketball Federation.

---

## Multilingual Glossary Table

Section summary: This section is the full 50-term multilingual table mapping English basketball terminology to French, Spanish, German, Italian, Serbian, Greek, Lithuanian, Russian, and Turkish equivalents.

| English | French | Spanish | German | Italian | Serbian | Greek | Lithuanian | Russian | Turkish |
|---|---|---|---|---|---|---|---|---|---|
| Pick and roll | Écran-rouleau | Bloqueo y continuación | Pick-and-Roll | Pick e roll | Пик и рол | Πικ εντ ρολ | Pick-and-rolas | Заслон и выход | Pick and roll |
| Screen | Écran | Bloqueo | Block | Blocco | Блок | Μπλοκ | Ekranas | Заслон | Blok |
| Roll | Rouleau | Continuación | Rollen | Roll | Рол | Ρολάρισμα | Rolas | Выход под кольцо | Roll |
| Pop | Sortie extérieure | Salir al exterior | Heraustreten | Pop | Поп | Άνοιγμα στα τρία | Popas | Выход на трёхочковую | Pop |
| Slip | Slip | Corte anticipado | Slip / Frühaustritt | Slip | Слип | Σλιπ | Slipas | Слип / Ранний выход | Slip |
| Cut | Coupe | Corte | Schnitt / Laufaktion | Taglio | Сечење / Рез | Κόψιμο | Įsilaužimas | Врезка / Рез | Kesme |
| Back cut | Coupe dans le dos | Corte por detrás | Backdoor-Cut | Backdoor | Бек-кат | Οπίσθιο κόψιμο | Nugarinis įsilaužimas | Бэк-кат | Arkadan kesme |
| Flare | Flare | Pantalla de salida | Flare-Block | Flare | Флер екран | Φλερ σκριν | Flaras | Флэр | Flare bloğu |
| Drive | Pénétration | Penetración | Durchbruch | Penetrazione | Продор | Ντράιβ | Prasiveržimas | Проход | Penetrasyon |
| Kick-out pass | Passe de relâchement | Pase de kick-out | Aussenpass | Passaggio di scarico | Кик-аут пас | Πάσα προς τα έξω | Perdavimas į kraštą | Пас на периметр | Dış pas |
| Skip pass | Passe longue croisée | Pase cruzado | Querpass | Skip pass | Скип пас | Σκιπ πάσα | Ilgas persimetimas | Скип-пас | Atlama pası |
| Post up | Jeu dos au panier | Juego de poste | Postspiel / Rücken zum Korb | Giocare di spalle | Пост игра | Παιχνίδι πλάτης | Žaidimas nugaromis | Игра в посте | Post up |
| Low block | Poste bas | Poste bajo | Tiefer Posten | Post basso | Ниска позиција | Χαμηλό ποστ | Žemas postas | Низкий блок / Пост | Alt blok |
| Elbow | Coude | Codo | Ellenbogen | Gomito / Angolo del pitturato | Лакат | Αγκώνας / Γωνία | Alkūnė | Локоть | Dirsek |
| Top of the key | Haut de la raquette | Parte alta del poste | Freiwurfkreis / Oben | Punto in cima all'area | Врх рекета | Κορυφή της ρακέτας | Aukštasis raketo taškas | Верхушка ключа | Serbest atış çemberi üstü |
| Wing | Aile | Lateral / Ala | Flügel | Ala | Крило | Πλευρά / Φτερό | Sparnas | Фланг | Kanat |
| Corner | Coin | Esquina | Ecke | Angolo | Угао | Γωνία | Kampas | Угол | Köşe |
| Paint / Key | Raquette | Zona / Pintura | Freiwurf-Zone / Schlüssel | Area dei tre secondi | Зона / Терен слободног бацања | Μπογιά / Ρακέτα | Trapecoidas / Dažytas plotas | Краска / Зона | Boya / Alan |
| Help defence | Défense de soutien | Defensa de ayuda | Hilfsverteidigung | Difesa di aiuto | Помоћна одбрана | Αμυντική βοήθεια | Pagalbinė gynyba | Страховка / Помощь в защите | Yardım savunması |
| On-ball defence | Défense sur porteur | Defensa sobre balón | Ballverteidigung | Difesa sull'uomo con palla | Одбрана над лоптом | Άμυνα στον κάτοχο | Gynyba prie kamuolio | Защита на игроке с мячом | Topa sahip oyuncuya savunma |
| Closeout | Fermeture / Sortie sur tireur | Cerrar sobre el tirador | Closeout | Chiusura sul tiratore | Излазак на шутера | Κλείσιμο πάνω στον σουτέρ | Artėjimas prie šaulio | Клосаут / Выход на броск | Closeout |
| Hedge | Montée préventive | Salida preventiva | Vorstehend / Heraustreten | Hedging | Хековање | Εμποδισμός / Χεντζ | Hedžas | Хедж / Выход на заслон | Hedge |
| Drop coverage | Couverture basse | Cobertura baja | Drop-Coverage | Copertura bassa | Дроп покриће | Χαμηλή κάλυψη | Drop gynyba | Дроп / Защита с отступом | Drop savunması |
| Switch | Changement | Cambio | Wechsel | Cambio | Замена | Αλλαγή | Keitimasis | Переключение | Switch / Değişim |
| Trap | Piège | Trampa | Falle | Trappola | Замка | Παγίδα | Spąstai | Ловушка / Капкан | Tuzak |
| Transition | Transition | Transición | Transition | Transizione | Транзиција | Μετάβαση | Perėjimas | Переход | Geçiş |
| Fast break | Contre-attaque | Contraataque | Schneller Angriff / Fastbreak | Contropiede | Брзи напад | Αντεπίθεση | Greita ataka | Быстрый прорыв | Hızlı hücum |
| Set play | Action placée / Jeu organisé | Jugada organizada | Einstudierter Spielzug | Schema / Gioco organizzato | Постављена игра | Οργανωμένη επίθεση | Paruoštas žaidimas | Разученная комбинация | Belirlenmiş oyun |
| BLOB (baseline out of bounds) | Remise en jeu en fond de terrain | Saque de fondo | Einwurf von der Grundlinie | Rimessa dal fondo | Убацивање са основне линије | Μπάλα από τη βασική γραμμή | Kamuolys iš bazelinės | Вбрасывание с лицевой линии | Temel hattan atış |
| SLOB (sideline out of bounds) | Remise en jeu sur la touche | Saque lateral | Seiteneinwurf | Rimessa laterale | Убацивање са бочне линије | Μπάλα από την πλαϊνή γραμμή | Kamuolys iš šoninės | Вбрасывание с боковой линии | Yan hattan atış |
| ATO (after timeout) | Après temps mort | Después del tiempo muerto | Nach Auszeit | Dopo il time-out | После тајм-аута | Μετά το time-out | Po pertraukos | После тайм-аута | Mola sonrası |
| Zone defence | Défense de zone | Defensa en zona | Zonenverteidigung | Difesa a zona | Зонска одбрана | Ζωνική άμυνα | Zoninė gynyba | Зонная защита | Bölge savunması |
| Man-to-man defence | Défense homme à homme | Defensa al hombre | Manndeckung | Difesa a uomo | Човек на човека | Άμυνα άνδρας με άνδρα | Vienas prieš vieną | Персональная защита | Adam adama savunma |
| Press | Pressing | Presión | Pressing / Vollfeld-Presse | Pressing | Прес | Πρέσσα | Spaudimas | Прессинг | Pres |
| Half-court | Demi-terrain | Medio campo | Halbfeld | Metà campo | Полу-терен | Μισό γήπεδο | Pusė aikštės | Полукорт / Полплощадки | Yarı saha |
| Full court | Terrain entier | Pista completa | Ganzes Feld | Campo intero | Цело терен | Ολόκληρο γήπεδο | Visa aikštė | Весь корт | Tam saha |
| Ball-handler | Porteur de balle | Manejador del balón | Ballführer | Portatore di palla | Дриблер / Носач лопте | Χειριστής μπάλας | Kamuolininkas | Игрок с мячом | Top taşıyıcı |
| Screener | Poseur d'écran | Bloqueador | Blocksetter | Bloccante | Блокир | Εκρανευτής | Ekranuotojas | Заслоняющий | Blok yapan |
| Cutter | Coupeur | Cortador | Schnittläufer | Tagliatore | Резач | Κόπτης | Įsilaužėjas | Врезающийся | Kesici |
| Point guard | Meneur | Base / Director de juego | Aufbauspieler | Playmaker / Play | Плејмејкер (PG/1) | Πλέι-μέικερ | Pirmas gynėjas | Разыгрывающий (PG/1) | Oyun kurucu (PG/1) |
| Shooting guard | Arrière | Escolta | Shooting Guard | Guardia tiratrice | Бек шутер (SG/2) | Σουτέρ γκαρντ | Antrasis sargybinis | Атакующий защитник (SG/2) | Şut gardi (SG/2) |
| Small forward | Ailier | Alero | Kleiner Flügelspieler | Ala piccola | Мали крило (SF/3) | Μικρός φόργουορντ | Mažasis puolėjas | Лёгкий форвард (SF/3) | Küçük forvet (SF/3) |
| Power forward | Ailier fort | Ala-pívot | Power Forward | Ala grande | Крилни центар (PF/4) | Πάουερ φόργουορντ | Galingusis puolėjas | Тяжёлый форвард (PF/4) | Güçlü forvet (PF/4) |
| Centre | Pivot | Pívot / Centro | Center | Centro / Pivot | Центар (C/5) | Κέντρο / Πίβοτ | Centras | Центровой (C/5) | Pivot (C/5) |
| Dribble | Dribble | Bote / Dribling | Dribbeln | Palleggio | Дриблинг | Ντρίμπλα | Driblinas | Ведение мяча | Dribbling |
| Pass | Passe | Pase | Pass | Passaggio | Пас | Πάσα | Perdavimas | Пас | Pas |
| Shoot | Tir | Lanzamiento / Tiro | Wurf | Tiro | Шут | Βολή / Σουτ | Metimas | Бросок | Şut |
| Rebound | Rebond | Rebote | Rebound | Rimbalzo | Скок | Ριμπάουντ | Atkovimas | Подбор | Ribaunt |
| Turnover | Perte de balle | Pérdida de balón | Ballverlust | Palla persa | Изгубљена лопта | Απώλεια μπάλας | Klaida / Praradimas | Потеря мяча | Top kaybı |
| Foul | Faute | Falta | Foul | Fallo | Грешка / Фаул | Φάουλ | Pažeidimas | Фол / Нарушение | Faul |

---

## Usage Notes for the LLM

Section summary: This section provides the LLM with instructions on how to use this glossary table to pre-process multilingual queries before retrieval.

When a user query arrives in a language other than English, apply the following logic before attempting document retrieval:

1. **Scan the query for terms appearing in any non-English column** of the table above.
2. **Replace each matched term with its English equivalent** (the first column).
3. **Use the English-translated query** to retrieve chunks from the corpus.
4. **Return the response in the user's original language** — only the retrieval step uses English; the output language should match the user's input language.

### Example

User query (Italian): "Come organizzo la difesa a zona contro un contropiede?"

Translation using this glossary:
- "difesa a zona" → zone defence
- "contropiede" → fast break

Translated query for retrieval: "How do I organise zone defence against a fast break?"

Retrieval targets: `basketball_defensive_systems.pdf` (zone defence sections), `drill_library_defence_transition.md` (transition defence drills).

### Borrowed terms note

Many European languages borrow English basketball terms directly rather than translating them (e.g., "pick and roll", "switch", "press", "dribble" appear in Italian, French, Serbian, and Greek basketball communities in their English or phonetically adapted form). Where a borrowed English term appears in a non-English query, it will still match correctly against this glossary or directly against the corpus without translation.
