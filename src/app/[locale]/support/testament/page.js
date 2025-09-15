"use client";

import { useLocale } from "next-intl";
import Image from "next/image";

export default function TestamentPage() {
  const locale = useLocale();

  const contentDe = (
    <article className="prose prose-lg max-w-3xl mx-auto py-10 prose-headings:text-red-700 prose-a:text-red-600">
      <h1>ila über den Tod hinaus</h1>

      <p>
        Als eine kleine Gruppe 1976 in Bonn die ila gründete, dachte wohl
        keine*r von ihnen, dass es sie fünfzig Jahre später noch immer geben
        würde. Manche von uns sind seit 30, 40 sogar 50 Jahren dabei, andere
        sind inzwischen leider verstorben, dies gilt auch für unsere
        Leser*innen. Doch trotz einigen Schwierigkeiten ist es uns immer wieder
        gelungen, junge Menschen zu begeistern bei uns mitzumachen. Nicht alle
        von uns werden die nächsten 50 Jahre erleben. Aber wenn wir uns die
        Weltlage anschauen, wird die Arbeit der ila wohl auch in 50 Jahren noch
        wichtig sein.
      </p>

      {/* 📷 Imagen */}
      <div className="flex justify-center my-6">
        <Image
          src="/ila_testament.jpg"
          alt="ila Totenkopf Illustration"
          width={400}
          height={400}
          className="rounded-lg shadow-md"
        />
      </div>

      <p>
        Um diese Arbeit auch in Zukunft leisten zu können, benötigen wir Eure
        Unterstützung. Nicht nur jetzt, sondern auch in Zukunft, wenn ihr
        vielleicht nicht mehr unter uns weilt. Wenn ihr auf dieser Seite
        gelandet seid, kennt und schätzt ihr unsere Arbeit vielleicht schon sehr
        lange. Um die ila auch nach eurem Tod zu unterstützen, gibt es die
        Möglichkeit, uns in eurem Testament zu berücksichtigen.
      </p>

      <h2>Wie das geht?</h2>
      <p>
        Angesichts unserer Leistungen werden unsere Kräfte manchmal überschätzt,
        aber das täuscht. Unser „Verwaltungsapparat“ ist mit einer
        Ehrenamtlichen und zwei überlasteten Teilzeitkräften bestückt. Wir
        können weder eine*n in der Materie sachkundige*n Ansprechspartner*in
        anbieten, noch juristischen Beistand leisten, wie die großen
        Organisationen. Wir bitten euch darum, die ila nicht als Erben in eurem
        Testament zu erwähnen. Ein Haus oder Grundstück zu erben, würde uns
        überfordern. Ihr könnt in eurem Testament aber ein Vermächtnis an die
        ila erwähnen. Das hilft uns sehr. Wie genau das geht, könnt ihr in einer{" "}
        <a
          href="https://www.medico.de/fileadmin/user_upload/media/solidarisches-erbe.pdf"
          target="_blank"
          rel="noopener noreferrer"
        >
          Broschüre von medico international
        </a>{" "}
        nachlesen.
      </p>

      <p>
        Die Erb*innen sind verpflichtet, Vermächtnisse zu erfüllen, soweit der
        Nachlass nach Erfüllung von Kosten, Verbindlichkeiten und den
        vorrangigen Pflichtteilsrechten noch ausreicht. Die ila ist als
        gemeinnütziger Verein von der Erbschafts- und Schenkungssteuer befreit.
      </p>

      <p>
        Ein Vermächtnis im Testament zu notieren ist ganz einfach –
        vorausgesetzt ihr habt etwas zu vermachen. Aber irgendwo müssen die
        vielen Milliarden ja liegen, die angeblich in den nächsten Jahren
        vererbt werden.
      </p>

      <p className="mt-6 font-semibold">Eure ila</p>
    </article>
  );

  const contentEs = (
    <article className="prose prose-lg max-w-3xl mx-auto py-10 prose-headings:text-red-700 prose-a:text-red-600">
      <h1>ila más allá de la muerte</h1>

      <p>
        Cuando un pequeño grupo fundó la ila en Bonn en 1976, seguramente nadie
        pensó que seguiría existiendo cincuenta años después. Algunas personas
        llevan 30, 40 o incluso 50 años en el proyecto, otras lamentablemente
        han fallecido, lo mismo que parte de nuestra lectoría. Sin embargo, pese
        a las dificultades, siempre logramos entusiasmar a jóvenes para que se
        sumen. No todxs veremos los próximos 50 años, pero viendo la situación
        mundial, el trabajo de la ila seguirá siendo importante.
      </p>

      {/* 📷 Imagen */}
      <div className="flex justify-center my-6">
        <Image
          src="/ila_testament.jpg"
          alt="ila Calavera ilustración"
          width={400}
          height={400}
          className="rounded-lg shadow-md"
        />
      </div>

      <p>
        Para poder seguir haciendo este trabajo en el futuro necesitamos su
        apoyo. No solo ahora, sino también después, cuando quizá ya no estén con
        nosotrxs. Si han llegado a esta página es porque conocen y valoran
        nuestro trabajo desde hace tiempo. Para apoyar a la ila después de su
        muerte, existe la posibilidad de incluirnos en su testamento.
      </p>

      <h2>¿Cómo funciona?</h2>
      <p>
        A veces se sobrestima nuestra capacidad, pero eso es una ilusión.
        Nuestro “aparato administrativo” consiste en una persona voluntaria y
        dos trabajadoras a tiempo parcial sobrecargadas. No podemos ofrecer un
        contacto experto en la materia ni asesoría jurídica como las grandes
        organizaciones. Por eso les pedimos que no nombren a la ila como
        heredera en su testamento: heredar una casa o un terreno nos
        sobrepasaría. Pero sí pueden dejar un legado a favor de la ila. Eso nos
        ayuda mucho. Cómo hacerlo lo pueden leer en un{" "}
        <a
          href="https://www.medico.de/fileadmin/user_upload/media/solidarisches-erbe.pdf"
          target="_blank"
          rel="noopener noreferrer"
        >
          folleto de medico international
        </a>
        .
      </p>

      <p>
        Lxs herederxs están obligadxs a cumplir con los legados, siempre que la
        herencia, después de cubrir costos, deudas y derechos prioritarios, lo
        permita. La ila, como asociación sin fines de lucro, está exenta del
        impuesto de sucesiones y donaciones.
      </p>

      <p>
        Anotar un legado en el testamento es muy sencillo, siempre que haya algo
        que legar. Pero en algún lugar deben estar esos miles de millones que se
        dice que se heredarán en los próximos años.
      </p>

      <p className="mt-6 font-semibold">Su ila</p>
    </article>
  );

  return <>{locale === "es" ? contentEs : contentDe}</>;
}
