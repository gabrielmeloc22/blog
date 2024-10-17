---
title: "JSX in React and a common pitfall"
description: "A practical example of how abstractions can be problematic for beginners"
date: "Mar 22 2024"
slug: "jsx-in-react-and-a-common-pitfall"
---

If you ever came across any front-end framework you probably know what JSX is and how it works. By definition, JSX is just a syntax extension for Javascript, just like Typescript is a superset of Javascript. Which means that JSX is just Javascript with some extra syntax sugar to write declarative HTML-like code that will eventually be transpiled to native browser code.

With that in mind, chances are high you already heard someone saying _'React is just Javascript'_ and then showing how the JSX you write in React code is transpiled to vanilla Javascript.

Some jsx:

```jsx
function Header() {
  return <header>my header</header>;
}
```

Its Javascript counterpart:

```js
function Header() {
  return React.createElement("header", {}, "my header");
}
```

Aside from the fact that `createElement` helper is now considered legacy API, that's pretty much correct, however there is a catch that most beginners fall for.

Take the following example using the component we just created.

```jsx
function Page() {
  return <Header />;
}
```

```jsx
function Page() {
  return Header();
}
```

Using JSX or not, we should get the same result right? And as expected, if you run this code you'll sure see the same thing on your page. So what's so problematic about that, isn't a React component just a Javascript function?

Well, not exactly. We missed an important step in the second example: we're not creating a React element!

We have just brute force called our header component and that should never really happen, because now what React is really seeing is that:

```jsx
function Page() {
  return React.createElement("header", {}, "my header");
}
```

Which means that our `Header` component does not exist anymore and all the elements returned in it are registered under the `Page` component.

### Who cares?

You might say _'registering elements under the wrong component name, is that much of a big deal?'_. Aside from turning debugging into a living hell, in a world where _React Hooks_ exist, you'll see that it makes a huge difference the way you call your component, or better, the way **React calls your components**.

Suppose now we add a state for our little header component to toggle a secret message like so.

```jsx
function Header() {
  const [active, setActive] = useState(false);

  return (
    <header>
      my header
      <button onClick={() => setActive((prev) => !prev)}>don't click me</button>
      {active && <p>whaaat, how did you find this?</p>}
    </header>
  );
}
```

Again, what will happen? All of that code will be the return of our page component, which means that a hook is being called in a non top-level place, we're breaking one of the most fundamental rules of hooks.

### _[Hooks should only be called at top level!](https://react.dev/reference/rules/rules-of-hooks#only-call-hooks-at-the-top-level)_

![React fight club meme](./assets/react-fight-club.gif)

Just like calling a hook conditionally, calling a hook in this way, will lead to inconsistent renders or straight up crashes of our app, and that's because React relies on the order in which hooks were called when reconciling two versions of the same component.

## But there's more...

As mentioned previously, React is the one who will call our components during rendering and store the elements returned as well as registering its hooks under the proper name, so calling it directly bypasses all of that and now every time something changes in the header component, React will look at that as if something had changed in the page component, thus rendering the whole `Page` again, a big performance penalty.

So, now you can see the part we missed when transpiling our JSX manually:

```js
function Page() {
  return React.createElement(Header, {});
}
```

It's easy to tell what happens now, we never actually call the component function when declaring some JSX, we're just hiding the `createElement` call in benefit of a more declarative easy-to-read code.

## A more realistic example

The motivation of this post came from a peculiar situation I encountered at work which later on another developer had trouble understanding, let me give you the setup. We had a component that rendered a button that prints a `react-pdf` document, I'll simplify for brevity, but it looks something like this:

```jsx
const ChargeActionsPDFDocument = (props) => {
  const { t } = useTranslation();

  return (
    <Document>
      <Page style={styles.page} wrap>
        <Typography>{t("Value")}</Typography>
        <Typography>{props.charge.value}</Typography>
      </Page>
    </Document>
  );
};

const ChargeActionsPrintPDFButton = () => {
  const { t } = useTranslation();

  const iframeRef = useRef(null);

  const charge = {
    value: 100,
  };

  const handlePrint = (): void => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.print();
    }
  };

  return (
    <BlobProvider document={ChargeActionsPDFDocument({ charge })}>
      {({ url, loading, error }) => {
        const hasUrl = !!url;
        const hasError = !!error;
        const isLoading = loading;

        const shouldRenderIframe = !isLoading && !hasError && hasUrl;

        return (
          <>
            {shouldRenderIframe && (
              <iframe ref={iframeRef} src={url} style={{ display: "none" }} />
            )}
            <button onClick={handlePrint}>{t("Download Invoice")}</button>
          </>
        );
      }}
    </BlobProvider>
  );
};

const App = () => {
  return (
    <TranslationProvider>
      <ChargeActionsPrintPDFButton />
    </TranslationProvider>
  );
};
```

You can see that we have a really simple component tree, you can also see that we have a `useTranslation` hook that allow us to access the `TranslationContext` value.

If you got a great eye, you already spotted the problem. The `ChargeActionsPDFDocument` is being called directly as a function!

**Easy fix, just use JSX!**

```jsx
const ChargeActionsPrintPDFButton = () => {
  const { t } = useTranslation();

  const iframeRef = useRef(null);

  const charge = {
    value: 100,
  };

  const handlePrint = (): void => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.print();
    }
  };

  return (
    <BlobProvider document={<ChargeActionsPDFDocument charge={charge} />}>
      {({ url, loading, error }) => {
        const hasUrl = !!url;
        const hasError = !!error;
        const isLoading = loading;

        const shouldRenderIframe = !isLoading && !hasError && hasUrl;

        return (
          <>
            {shouldRenderIframe && (
              <iframe ref={iframeRef} src={url} style={{ display: "none" }} />
            )}
            <button onClick={handlePrint}>{t("Download Invoice")}</button>
          </>
        );
      }}
    </BlobProvider>
  );
};
```

Unfortunately, if you try to make the right thing here, you'll see that our translation hook will stop working, that anti-pattern we've been talking about was a workaround someone else found to not break the `useTranslation`.

But why it does not work in the first place? Because when we use JSX, it is not React who's calling the `ChargeActionsPDFDocument` function, it is React PDF renderer that will indeed [render](https://github.com/diegomura/react-pdf/blob/master/packages/renderer/src/dom/usePDF.js#L14) the component, and in that rendering phase, we do not have access to the translation context.

Now, if we call the component directly, something magical happens and we can consume again the context because we're just executing the function, not really rendering anything, and in that context, we have access to the provider.

## Correct approach

What would be a better approach? Simple, just wrap the component in the provider again. It might sound redundant, but this way we don't create unpredictable behaviors and the context dependencies of our component get declared more clearly.

```jsx
const document = (
  <TranslationProvider>
    <ChargeActionsPDFDocument charge={charge} />
  </TranslationProvider>
);
```

Now the document has access to the context because they will render together!

If you want to fiddle around, I made a small **[codesandbox](https://cjsp5c.csb.app/)** with the code showed here. Note that it only works in the full preview and not in the codesandbox editor, that's because of the browser cross origin policy. Anyways, you'll see that the string only gets translated when not using the JSX version.

## Beware the abstraction

![It's all a damn abstraction?](./assets/its-all-abstractions.jpg)

To wrap things up, while it's true that JSX was one of the reasons that made React so popular, it is one of React abstractions that encourage beginners to trust the framework blindly and not learn what really happens under the hood, falling to these silly traps and at worst becoming a _framework developer_.

It is important to know how to use great tools to get things done faster, but when push comes to shove, it's even better to understand why is the tool not doing what you expect.

---

### My first blog post and what's next

Hi there! I've been procrastinating a lot to create this blog, so now that I've got some free time I finally had the courage to put this out and start off with something, I must say that's not my proudest piece of writing, but you gotta start somewhere. Anyways, I still haven't got an interesting name, so I'm just using my name as the title of the blog, which I find a little lame, but for now it's useful for people to know who I am. Also, the whole idea of this blog is to connect with others and share some of my thoughts, to help with that I'll try to create a comment section which might be useful for feedback directly in here, 'til then, you can find me on my socials below. Overall, i'll incrementally improve this site, add an about section, some articles I find interesting, etc. Feel free to let me know what are your thoughts about this first post (specially if i got something wrong).

Have a great day!
