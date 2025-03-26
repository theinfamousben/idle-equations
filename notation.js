function timeNotation(ms) {
    const dateObj = new Date(ms);
    const hours = dateObj.getUTCHours();
    const minutes = dateObj.getUTCMinutes();
    const seconds = dateObj.getSeconds();
    const milliseconds = ms.toString().slice(-3);
    const timeString = hours.toString().padStart(2, '0') + ':' +  minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0') + "." + milliseconds;

    return timeString;
}

function biNotation(vala, decpointa, notationa) {
    const notation = notationa ?? 0;
    const val = new Decimal(vala);
    const mant = new Decimal(val.mantissa);
    const exp = new Decimal(val.exponent);
    const decpoint = new Decimal(decpointa) ?? 3;


    if (val.lt(1000)) {
        return(val.equals(0) ? "0" : val.toFixed(decpoint));
    }

    if (notation == 0) {
        if (exp.lt(33)) return(StandardNotation(mant, exp));
        else return(SciNotation(mant, exp));
    }
    else if (notation == 1) return(StandardNotation(mant, exp));
    else if (notation == 2) return(SciNotation(mant, exp));
    
}

function StandardNotation(mant, exp) {
    let suffixes = ["", "K", "M", "B", "T", "Qa", "Qt", "Sx", "Sp", "Oc", "No", "Dc"];

    switch(exp % 3) {
        case 0: return(mant.toFixed(2) + suffixes[Math.floor(exp/3)]);
        case 1: return((mant * 10).toFixed(2) + suffixes[Math.floor(exp/3)]);
        case 2: return((mant * 100).toFixed(2) + suffixes[Math.floor(exp/3)]);
    }
}

function SciNotation(mant, exp) { return(mant.toFixed(2) + "e" + biNotation(exp, 0)); }

export { biNotation, timeNotation}; 