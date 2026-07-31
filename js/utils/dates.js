function gregorianToJalali(
gy,
gm,
gd
){

const gdm = [
0,
31,
59,
90,
120,
151,
181,
212,
243,
273,
304,
334
];

let jy;

if(
gy > 1600
){

jy =
979;

gy -=
1600;

}else{

jy =
0;

gy -=
621;

}

const gy2 =
gm > 2
?
gy + 1
:
gy;

let days =

365 * gy

+

Math.floor(
(gy2 + 3) / 4
)

-

Math.floor(
(gy2 + 99) / 100
)

+

Math.floor(
(gy2 + 399) / 400
)

-

80

+

gd

+

gdm[
gm - 1
];

jy +=
33 *
Math.floor(
days / 12053
);

days %=
12053;

jy +=
4 *
Math.floor(
days / 1461
);

days %=
1461;

if(
days > 365
){

jy +=
Math.floor(
(days - 1) / 365
);

days =
(days - 1) % 365;

}

let jm;

if(
days < 186
){

jm =
1 +
Math.floor(
days / 31
);

}else{

jm =
7 +
Math.floor(
(days - 186) / 30
);

}

const jd =
1 +
(
days < 186
?
days % 31
:
(days - 186) % 30
);

return {

year:jy,

month:jm,

day:jd

};

}






function getTodayJalali(){

const now =
new Date();

const result =
gregorianToJalali(

now.getFullYear(),

now.getMonth() + 1,

now.getDate()

);

return (

String(
result.year
)

+

"/"

+

String(
result.month
)
.padStart(
2,
"0"
)

+

"/"

+

String(
result.day
)
.padStart(
2,
"0"
)

);

}
