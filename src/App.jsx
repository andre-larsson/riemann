import PrimeCount from './sections/PrimeCount.jsx'
import EulerProduct from './sections/EulerProduct.jsx'
import ZetaPlane from './sections/ZetaPlane.jsx'
import CriticalLine from './sections/CriticalLine.jsx'
import ExplicitFormula from './sections/ExplicitFormula.jsx'
import ErrorScale from './sections/ErrorScale.jsx'
import ScaledError from './sections/ScaledError.jsx'

const SECTIONS = [
  ['primes', 'How many primes are there?'],
  ['euler', 'Euler’s bridge from primes to ζ'],
  ['plane', 'Riemann’s step: let s be complex'],
  ['hypothesis', 'The hypothesis'],
  ['music', 'The music of the primes'],
  ['why', 'Why the line matters'],
]

function Section({ id, n, children }) {
  const title = SECTIONS.find((s) => s[0] === id)[1]
  return (
    <section id={id} aria-labelledby={id + '-h'}>
      <h2 id={id + '-h'}>
        <span className="step">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  )
}

export default function App() {
  return (
    <main>
      <header className="hero">
        <p className="eyebrow">An interactive explainer</p>
        <h1>The Riemann hypothesis</h1>
        <p className="lede">
          Up close, the prime numbers look random. From far away they follow a smooth law. The Riemann hypothesis
          is a precise claim about how far the primes can stray from that law. The answer is hidden in the zeros of
          one function, ζ(s), and the hypothesis says that all of those zeros lie on one straight line.
        </p>
        <p>
          This page builds the idea in six steps. Every chart is live: drag the sliders, and hover over or tap a
          chart to read exact values.
        </p>
        <nav aria-label="Contents">
          <ol className="toc">
            {SECTIONS.map(([id, title]) => (
              <li key={id}>
                <a href={'#' + id}>{title}</a>
              </li>
            ))}
          </ol>
        </nav>
      </header>

      <Section id="primes" n={1}>
        <p>
          A prime is a whole number above 1 that only divides by 1 and itself: 2, 3, 5, 7, 11, 13, … Every whole
          number is a product of primes in exactly one way. So the primes are the atoms of arithmetic.
        </p>
        <p>
          Write <i>π</i>(<i>x</i>) for the number of primes up to <i>x</i>. For example,{' '}
          <span className="nb"><i>π</i>(10) = 4</span>, because of 2, 3, 5 and 7. Gauss noticed as a teenager that near a large
          number <i>x</i>, about one number in <span className="nb">ln <i>x</i></span> is prime.
        </p>
        <p>
          A simple chance argument shows where the logarithm comes from. Think of the sieve of Eratosthenes. The
          prime 2 removes half of all numbers, so a number survives with chance <span className="nb">1 − 1/2</span>.
          The prime 3 removes one third, so a number survives with chance <span className="nb">1 − 1/3</span>. In
          general, a number survives the prime <i>p</i> with chance <span className="nb">1 − 1/<i>p</i></span>. A
          number is prime when no smaller prime divides it. Treat the primes as
          independent. Then the chance <i>D</i>(<i>x</i>) that a number near <i>x</i> is prime is a product over
          the primes below <i>x</i>:
        </p>
        <p className="math display">
          <span className="nb">
            <i>D</i>(<i>x</i>) ≈ (1 − 1/2)(1 − 1/3)(1 − 1/5) ⋯
          </span>{' '}
          <span className="nb">
            = ∏<sub><i>p</i> &lt; <i>x</i></sub> (1 − 1/<i>p</i>)
          </span>
        </p>
        <p>
          Now move <i>x</i> forward by a small step d<i>x</i>. The step contains about{' '}
          <span className="nb"><i>D</i> d<i>x</i></span> new primes. Each new prime is close to <i>x</i>, so it multiplies
          the product by <span className="nb">1 − 1/<i>x</i></span>. Thus the density decreases at the rate
        </p>
        <p className="math display">
          d<i>D</i> / d<i>x</i> = −<i>D</i>
          <sup>2</sup> / <i>x</i>
        </p>
        <p>
          This equation says that 1/<i>D</i> grows at the rate 1/<i>x</i>. So 1/<i>D</i> is{' '}
          <span className="nb">ln <i>x</i></span> plus a
          constant, and the constant does not matter when <i>x</i> is large. The result is{' '}
          <span className="math">
            <i>D</i>(<i>x</i>) ≈ 1 / ln <i>x</i>
          </span>
          , which is the density that Gauss found. The argument is not a proof, because the sieve steps are not
          fully independent. But it gives the correct answer. If you add up that density, you get the logarithmic
          integral
        </p>
        <p className="math display">
          li(<i>x</i>) = ∫<sub>0</sub>
          <sup>
            <i>x</i>
          </sup>{' '}
          d<i>t</i> / ln <i>t</i>
        </p>
        <PrimeCount />
        <p>
          The <em>prime number theorem</em> (Hadamard and de la Vallée Poussin, 1896) says that the ratio{' '}
          <span className="nb"><i>π</i>(<i>x</i>) / li(<i>x</i>)</span> tends to 1. That fixes the main trend. It says
          little about the size of the error <span className="nb">li(<i>x</i>) − <i>π</i>(<i>x</i>)</span>. The Riemann hypothesis is a statement about exactly that
          error. Step 6 comes back to it.
        </p>
      </Section>

      <Section id="euler" n={2}>
        <p>
          In 1737 Euler studied the sum <span className="math">ζ(<i>s</i>) = 1 + 1/2<sup><i>s</i></sup> + 1/3
          <sup>
            <i>s</i>
          </sup>{' '}
          + 1/4<sup><i>s</i></sup> + …</span>{' '}
          for real numbers <span className="nb"><i>s</i> &gt; 1</span>. He found that the sum equals a product with one factor for each prime:
        </p>
        <p className="math display">
          <span className="nb">
            ζ(<i>s</i>) = Σ<sub><i>n</i></sub> 1 / <i>n</i><sup><i>s</i></sup>
          </span>{' '}
          <span className="nb">
            = ∏<sub><i>p</i></sub> 1 / (1 − <i>p</i><sup>−<i>s</i></sup>)
          </span>
        </p>
        <p>
          Why? Write each factor as a geometric series,{' '}
          <span className="nb">1 + <i>p</i><sup>−<i>s</i></sup> + <i>p</i><sup>−2<i>s</i></sup> + …</span>, and multiply
          all of them out. Each term 1/<i>n</i>
          <sup>
            <i>s</i>
          </sup>{' '}
          appears exactly once, because each <i>n</i> has exactly one prime factorization. The formula is unique
          factorization written as an equation. It is the bridge that lets us study primes with ζ.
        </p>
        <EulerProduct />
      </Section>

      <Section id="plane" n={3}>
        <p>
          In 1859 Riemann wrote his only paper on number theory. It is eight pages long. He let <i>s</i> be a
          complex number, <span className="nb"><i>s</i> = <i>σ</i> + <i>it</i></span>. The sum only converges when{' '}
          <span className="nb"><i>σ</i> &gt; 1</span>. But ζ has exactly one smooth (analytic) extension to the whole plane,
          with a single pole at <span className="nb"><i>s</i> = 1</span>. That
          extension is what we now call the Riemann zeta function.
        </p>
        <p>
          The picture below shows it. Each point <i>s</i> gets a colour for the direction of the value ζ(
          <i>s</i>). Two kinds of zero appear:
        </p>
        <ul>
          <li>
            <strong>Trivial zeros</strong> at <span className="nb"><i>s</i> = −2, −4, −6, …</span> They are easy to explain and carry no deep
            information.
          </li>
          <li>
            <strong>Nontrivial zeros</strong> inside the <em>critical strip</em>{' '}
            <span className="nb">0 &lt; <i>σ</i> &lt; 1</span>. They come in mirror pairs above and below the real axis. The
            first one is at about <span className="nb">½ + 14.1347<i>i</i></span>.
          </li>
        </ul>
        <ZetaPlane />
        <p>
          Zoom out and move up the strip. Every nontrivial zero you find sits exactly on the{' '}
          <em>critical line</em> <span className="nb"><i>σ</i> = ½</span>.
        </p>
      </Section>

      <Section id="hypothesis" n={4}>
        <blockquote className="statement">
          Every nontrivial zero of the zeta function has real part ½.
        </blockquote>
        <p>
          Riemann wrote that this is “very likely” and did not try to prove it. It is one of the seven Millennium
          Prize Problems of the Clay Mathematics Institute.
        </p>
        <p>
          The widget follows ζ up a vertical line in the plane. On the left, the value{' '}
          <span className="nb">ζ(<i>σ</i> + <i>it</i>)</span> is traced as a path while <i>t</i> grows. On the right is its
          size |ζ|. On <span className="nb"><i>σ</i> = ½</span> the path runs
          through the origin again and again. Move <i>σ</i> even a little and the path misses the origin every
          time.
        </p>
        <CriticalLine />
        <p>
          Computers have checked more than ten trillion zeros, and all of them lie on the line. Hardy proved in 1914
          that infinitely many zeros lie on it, and Conrey proved in 1989 that more than 40% of them do. None of
          this shows that <em>all</em> of them do. That is the hypothesis.
        </p>
      </Section>

      <Section id="music" n={5}>
        <p>
          Here is why the zeros matter for primes. Count primes with a weight: each prime <i>p</i>, and each prime
          power <i>p</i>
          <sup>2</sup>, <i>p</i>
          <sup>3</sup>, …, adds <span className="nb">ln <i>p</i></span>. This count is Chebyshev’s function{' '}
          <i>ψ</i>(<i>x</i>). It is a staircase with a step at each prime power, and its trend is{' '}
          <span className="nb"><i>ψ</i>(<i>x</i>) ≈ <i>x</i></span>. That is the prime number theorem in another form.
        </p>
        <p>Riemann found an exact formula for this staircase (von Mangoldt finished the proof in 1895):</p>
        <p className="math display">
          <span className="nb">
            <i>ψ</i>(<i>x</i>) = <i>x</i> − Σ<sub><i>ρ</i></sub> <i>x</i><sup><i>ρ</i></sup> / <i>ρ</i>
          </span>{' '}
          <span className="nb">
            − ln 2π − ½ ln(1 − <i>x</i><sup>−2</sup>)
          </span>
        </p>
        <p>
          The sum runs over the nontrivial zeros <i>ρ</i>. Each pair of zeros{' '}
          <span className="nb"><i>ρ</i> = ½ ± <i>iγ</i></span> adds one wave in <span className="nb">ln <i>x</i></span>.
          The height <i>γ</i> sets the frequency of the wave. The real part ½ sets its size,{' '}
          <span className="nb"><i>x</i><sup>½</sup> = √<i>x</i></span>. The zeros are the frequencies that the primes are built from, like the notes
          in a chord.
        </p>
        <ExplicitFormula />
      </Section>

      <Section id="why" n={6}>
        <p>
          A zero <span className="nb"><i>ρ</i> = <i>β</i> + <i>iγ</i></span> adds a wave of size about <i>x</i>
          <sup>
            <i>β</i>
          </sup>
          . Zeros also come in mirror pairs across the critical line: a zero with{' '}
          <span className="nb"><i>β</i> = 0.4</span> would force a partner with{' '}
          <span className="nb"><i>β</i> = 0.6</span>, and the larger wave wins. If every zero has{' '}
          <span className="nb"><i>β</i> = ½</span>, every wave grows like √<i>x</i>, and the primes follow li(<i>x</i>) as
          closely as they possibly can. Von Koch showed in 1901 that the hypothesis is equivalent to
        </p>
        <p className="math display">
          <i>π</i>(<i>x</i>) = li(<i>x</i>) + O(√<i>x</i> ln <i>x</i>)
        </p>
        <p>
          Schoenfeld made the constant explicit in 1976: if the hypothesis holds, then{' '}
          <span className="nb">|<i>π</i>(<i>x</i>) − li(<i>x</i>)|</span>{' '}
          <span className="nb">&lt; √<i>x</i> ln <i>x</i> / 8π</span> for every <span className="nb"><i>x</i> ≥ 2657</span>.
          If even one zero had <span className="nb"><i>β</i> &gt; ½</span>, its wave would grow like <i>x</i>
          <sup>
            <i>β</i>
          </sup>{' '}
          and the error would grow faster than that bound allows. Use the slider to imagine such a zero.
        </p>
        <ErrorScale />
        <p>
          The error <span className="nb">li(<i>x</i>) − <i>π</i>(<i>x</i>)</span> does not grow smoothly. Riemann’s
          formula splits it into two parts of about the same size, <span className="nb">√<i>x</i> / ln <i>x</i></span>.
          One part is an offset that comes from the squares
          of primes and higher prime powers. The other part is a sum of waves, one for each zero. Divide the error
          by <span className="nb">√<i>x</i> / ln <i>x</i></span> and the growth drops out. What is left swings around the offset, and the
          offset falls slowly toward 1.
        </p>
        <ScaledError />
        <p>
          It is known that li(<i>x</i>) is too high for every <i>x</i> up to 10<sup>19</sup>. Even so, Littlewood
          proved in 1914 that the sign changes infinitely often. Now and then the waves line up so well that they
          pull the scaled error below 0. The first time this happens is somewhere between 10<sup>19</sup> and about{' '}
          <span className="nb">1.4 × 10<sup>316</sup></span>. The chart above shows four regions where crossings have been found, from 10
          <sup>316</sup> out to 10<sup>9608</sup>.
        </p>
        <p>
          So the hypothesis says the primes are as regular as they can be. Their error behaves like the square root
          of the count, as it would for random coin tosses. Many results in number theory are proved “assuming the
          Riemann hypothesis”, for example bounds on the gaps between consecutive primes. A proof would make all of
          them unconditional.
        </p>
      </Section>

      <footer>
        <h2>Notes and sources</h2>
        <ul>
          <li>
            The zeros were computed with the mpmath library. The page computes ζ(<i>s</i>) itself with Borwein’s
            series and the functional equation, and counts primes up to 10 million with a sieve.
          </li>
          <li>
            <a href="https://en.wikipedia.org/wiki/Riemann_hypothesis">Riemann hypothesis</a> and{' '}
            <a href="https://en.wikipedia.org/wiki/Explicit_formulae_for_L-functions">explicit formulae</a> on
            Wikipedia.
          </li>
          <li>
            Sign changes of <span className="nb"><i>π</i>(<i>x</i>) − li(<i>x</i>)</span>: <a href="https://en.wikipedia.org/wiki/Skewes%27s_number">Skewes’s number</a> on
            Wikipedia. The 10,000-zero check of the dip near 10<sup>316</sup> used{' '}
            <a href="https://www-users.cse.umn.edu/~odlyzko/zeta_tables/">Andrew Odlyzko’s tables of zeros</a>.
          </li>
          <li>
            News on the November 2026 announcements:{' '}
            <a href="https://www.aljazeera.com/news/2026/11/21/riemann-hypothesis-has-the-worlds-most-famous-maths-problem-been-cracked">
              Al Jazeera
            </a>
            ,{' '}
            <a href="https://techcrunch.com/2026/11/20/ai-claimed-a-solution-to-the-167-year-old-riemann-hypothesis-and-a-human-did-too/">
              TechCrunch
            </a>
            .
          </li>
        </ul>
      </footer>
    </main>
  )
}
