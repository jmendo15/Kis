const regexes = {
    canadianPostalCode: /^[A-CEG-HJ-NPR-TV-Z]\d[A-CEG-HJ-NPR-TV-Z][ ]\d[A-CEG-HJ-NPR-TV-Z]\d$/,
    visa: /^4\d{12}(\d{3})?$/,
    masterCard: /^(^5[1-5]\d{14}$)|22[2-9][0-9]\d{12}|23\d{14}|24\d{14}|25\d{14}|26\d{14}|27[0-1]\d{13}|2720\d{12}$/,
    notThreeEndingInOO: /^(?!.(oo|Oo|oO|OO)$).*$/iu,
    divisibleBy16: /^(0+|[01]*0{4,})$/,
    eightThroughThirtyTwo: /^(?:[89]|[12][0-9]|3[0-2])$/,
    notPythonPycharmPyc: /^(?:()|(?!(^python$|^pyc$|^pycharm$)).+)$/u,
    restrictedFloats: /^\d+(.\d+)?(E|e)(\+|-)?\d{1,3}$/i,
    palindromes2358: /^(?:([abc])(\1)|([abc])[abc](\3)|([abc])([abc])[abc](\6)(\5)|([abc])([abc])([abc])([abc])(\12)(\11)(\10)(\9))$/,
    pythonStringLiterals: /^([ruf]|fr|rf)?('([^'\n\\]|\\.)*'|"([^"\n\\]|\\.)*"|'''('(?!'')|[^'\n\\]|\\.)*'''|"""("(?!"")|[^"\n\\]|\\.)*""")$/i,
}

export function matches(name, string) {
    return regexes[name].test(string)
}  