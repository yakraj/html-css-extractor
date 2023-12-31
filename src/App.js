import React, { useState } from "react";
import "./index.css";
import prettier from "prettier/standalone";
import htmlParser from "prettier/parser-html";
import cssParser from "prettier/parser-postcss";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const App = () => {
  const [htmlValue, setHtmlValue] = useState("");
  const [extractedCss, setExtractedCss] = useState("");
  const [extractedHtml, setExtractedHtml] = useState("");
  const [displayhtml, setdisplayhtml] = useState("");
  const [activedisplay, setActiveDisplay] = useState("html");

  // /highlighting for html code

  const extractCssFromHtml = () => {
    const tempElement = document.createElement("div");
    tempElement.innerHTML = htmlValue;

    const allElements = tempElement.querySelectorAll("*");
    const extractedCssArray = [];

    let classlists = [];
    allElements.forEach((element) => {
      const classes = Array.from(element.classList);
      if (element.style.outline.includes("dashed")) {
        element.style.removeProperty("outline");
      }
      classlists.push(...classes);
    });

    // Find classes that are repeated more than once
    const stringCounts = classlists.reduce((counts, string) => {
      counts[string] = (counts[string] || 0) + 1;
      return counts;
    }, {});

    const repeatedClasses = Object.keys(stringCounts).filter(
      (string) => stringCounts[string] > 1
    );

    repeatedClasses.forEach((ee) => {
      const elements = tempElement.getElementsByClassName(ee);
      const commonClassName = elements[0].className;
      const commonStyles = [];

      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        const inlineStyles = element.getAttribute("style").split(";");
        commonStyles.push(inlineStyles);
      }

      const commonElements = commonStyles.reduce((common, array) => {
        return common.filter((element) => array.includes(element));
      });

      const outputstyle = `.${ee}{${commonElements.join("; ")}}`;

      if (commonElements.length > 1) {
        extractedCssArray.push(outputstyle);
      }

      let removeProperties = commonElements.map((style) =>
        style.split(":")[0].trim()
      );

      removeProperties.forEach((prop) => {
        for (let i = 0; i < elements.length; i++) {
          elements[i].style.removeProperty(prop);
        }
      });
    });

    for (let i = 0; i < allElements.length; i++) {
      allElements[i].style.removeProperty("z-index");
      const styles = allElements[i].getAttribute("style");
      const identifier =
        allElements[i].classList.length > 0
          ? `.${allElements[i].classList[allElements[i].classList.length - 1]}`
          : `#${allElements[i].id}`;
      const objectExists = extractedCssArray.some((x) =>
        x.includes(identifier)
      );

      if (styles) {
        if (!objectExists) {
          extractedCssArray.push(`${identifier} {${styles}}`);
          allElements[i].removeAttribute("style");
        }
      }
    }

    const plaintext = extractedCssArray.join("");
    const formattedCssCode = prettier.format(plaintext, {
      parser: "css",
      plugins: [cssParser],
    });

    setExtractedCss(formattedCssCode);

    const divElements = tempElement.querySelectorAll("*");
    divElements.forEach((divElement) => {
      if (!divElement.style.length) {
        divElement.removeAttribute("style");
      }
      if (divElement.id) {
        divElement.removeAttribute("style");
      }
      if (divElement.classList.length > 0) {
        divElement.removeAttribute("id");
      } else {
        return;
      }
    });
    const formattedHtmlCode = prettier.format(tempElement.innerHTML, {
      parser: "html",
      language: "html",
      plugins: [htmlParser],
    });
    setExtractedHtml(formattedHtmlCode);
    setdisplayhtml(formattedHtmlCode);
  };
  const SelectHTML = () => {
    setActiveDisplay("html");
    setdisplayhtml(
      prettier.format(extractedHtml, {
        parser: "html",
        plugins: [htmlParser],
      })
    );
  };

  function convertHtmlToJsx(html) {
    // Replace class with className
    let jsx = html.replace(/class=/g, "className=");

    // Convert styles to camelCase with quotes

    jsx = jsx
      .replace(/style=(["'])(.*?)\1/g, (_, quote, styles) => {
        // extract the url function and replace it with a placeholder
        let urlFunction = "";
        styles = styles.replace(/url\((.*?)\)/g, (_, url) => {
          urlFunction = url;
          return "url(PLACEHOLDER)";
        });
        const camelCasedStyles = styles.replace(/-(\w)/g, (_, letter) =>
          letter.toUpperCase()
        );
        const styleProperties = camelCasedStyles
          .split(";")
          .map((prop) => prop.trim())
          .filter((prop) => prop !== "");
        let quotedStyles = styleProperties
          .map((property) => {
            const [key, value] = property
              .split(/:\s+/) // use colon followed by whitespace as separator
              .map((prop) => prop.trim());
            return `${key}: ${isNaN(value) ? `"${value}"` : value}`;
          })
          .join(", ");
        // put back the url function and replace the placeholder
        quotedStyles = quotedStyles.replace(
          "url(PLACEHOLDER)",
          `url(${urlFunction})`
        );
        return `style={{ ${quotedStyles} }}`;
      })
      .replace(/url\("([^"]*)"\)/g, (_, url) => {
        // replace commas with semicolons in the url function
        const fixedUrl = url.replace(/,/g, ";").trim(); // remove whitespace after semicolon
        return `url("${fixedUrl}")`;
      })
      .replace(/url\("([^"]*)"\)/g, (_, url) => {
        // replace double quotes with single quotes in the url function
        return `url('${url}')`;
      });

    return jsx;
  }

  const SelectJSX = () => {
    const jsx = convertHtmlToJsx(extractedHtml);
    // const jsx = htmlToJsx(extractedHtml);
    setdisplayhtml(jsx);
    setActiveDisplay("jsx");
  };

  const copyCSS = () => {
    navigator.clipboard
      .writeText(extractedCss)
      .then(() => {
        window.alert("CSS code successfully copied.");
      })
      .catch((err) => {
        console.error("Failed to copy element: ", err);
      });
  };

  const copyHTML = () => {
    navigator.clipboard
      .writeText(displayhtml)
      .then(() => {
        window.alert(
          `${activedisplay.toUpperCase()} code successfully copied.`
        );
      })
      .catch((err) => {
        console.error("Failed to copy element: ", err);
      });
  };

  return (
    <>
      <div id="main-container">
        <div className="container">
          <div className="insert-code">
            <div className="add-code-tab">
              <h2>Insert your Code</h2>
              <button
                onClick={() => extractCssFromHtml()}
                id="extract-css-btn"
                className="button"
              >
                Compile and Extract
              </button>
            </div>
            <textarea
              onChange={(e) => setHtmlValue(e.target.value)}
              id="html-code"
              defaultValue={""}
            />
          </div>
          <div className="lower-contaier">
            <div className="css-code">
              <div className="css-code-tab">
                <button className="button">CSS</button>
                <button onClick={() => copyCSS()} className="button">
                  COPY
                </button>
              </div>
              {extractedCss && (
                <SyntaxHighlighter language="css" style={vscDarkPlus}>
                  {extractedCss}
                </SyntaxHighlighter>
              )}
            </div>
            <div className="html-code">
              <div className="html-code-tab">
                <div>
                  <button onClick={() => SelectHTML()} className="button">
                    HTML
                  </button>
                  <button onClick={() => SelectJSX()} className="button">
                    JSX
                  </button>
                </div>
                <button onClick={() => copyHTML()} className="button">
                  COPY
                </button>
              </div>
              {displayhtml && (
                <SyntaxHighlighter language={activedisplay} style={vscDarkPlus}>
                  {displayhtml}
                </SyntaxHighlighter>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default App;
