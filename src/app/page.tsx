// src/app/page.tsx

export default function Home() {
  return (
    <div className="flex flex-col md:flex-row max-w-screen-xl mx-auto px-4 gap-4">
      {/* Bloque de la izquierda */}
      <aside className="hidden md:block md:w-1/4 bg-gray-100 p-4 rounded-lg shadow">
        <h2 className="text-lg font-bold">Bloque Izquierdo</h2>
        <p>Contenido pendiente por definir.</p>
      </aside>

      {/* Bloque central */}
      <main className="w-full md:w-2/4">
        <h1 className="text-2xl font-bold mb-4">Bienvenides a ILA</h1>
        <p className="mb-4">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed eget
          risus porta, tincidunt turpis at, interdum tortor. Vivamus lacinia
          tempor justo, nec venenatis nunc fringilla in. Maecenas ultrices,
          metus sit amet gravida malesuada, metus orci consectetur nunc, id
          suscipit nisi purus ut enim. Cras luctus metus vel elit efficitur, vel
          facilisis sem sagittis. Integer vehicula ex nec orci tincidunt, in
          scelerisque odio placerat. Nulla facilisi. Integer et posuere libero,
          ut auctor quam. Duis id vestibulum ipsum, et suscipit ligula. Praesent
          fringilla nisl ut nibh euismod, at venenatis orci vulputate. Curabitur
          convallis diam a nulla tincidunt fermentum. Ut dapibus quam sed tortor
          tincidunt, sit amet maximus justo dapibus. Suspendisse potenti. Nullam
          id tortor vel leo egestas faucibus non vel lacus.
        </p>
        <p className="mb-4">
          Praesent at magna facilisis, congue nunc eget, auctor lorem. Integer
          vehicula urna eu velit laoreet, quis dignissim libero vehicula. Sed
          tempor lectus vitae velit consectetur varius. Curabitur eu purus in
          lectus feugiat dignissim. Nam lacinia dapibus tincidunt. Ut euismod,
          ex nec eleifend accumsan, urna urna varius nisi, eu rutrum lectus erat
          id sapien. Ut id vestibulum risus. Nulla facilisi. Fusce quis nibh
          turpis. Etiam bibendum justo vel quam ultricies aliquam. Phasellus nec
          erat vel justo mollis congue id et leo. Curabitur sit amet ipsum at
          sapien varius malesuada ut ac turpis. Vivamus fermentum augue in
          mauris eleifend porttitor. In id urna accumsan, suscipit velit vel,
          mollis metus.
        </p>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed eget
          risus porta, tincidunt turpis at, interdum tortor. Vivamus lacinia
          tempor justo, nec venenatis nunc fringilla in. Maecenas ultrices,
          metus sit amet gravida malesuada, metus orci consectetur nunc, id
          suscipit nisi purus ut enim.
        </p>
      </main>

      {/* Bloque de la derecha */}
      <aside className="hidden md:block md:w-1/4 bg-gray-100 p-4 rounded-lg shadow">
        <h2 className="text-lg font-bold">Bloque Derecho</h2>
        <p>Contenido pendiente por definir.</p>
      </aside>
    </div>
  );
}
