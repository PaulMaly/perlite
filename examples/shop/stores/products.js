const { observe } = perlite;

export default observe(window?.__DATA__?.products ?? []);