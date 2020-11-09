const { observe } = ry;

export default observe(window?.__DATA__?.products ?? []);